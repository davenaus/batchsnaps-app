import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  const { priceId, userId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') as string,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
  )

  // Get the user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 400 })
  }

  let customer
  if (profile.stripe_customer_id) {
    customer = profile.stripe_customer_id
  } else {
    const newCustomer = await stripe.customers.create({
      metadata: {
        supabase_user_id: userId,
      },
    })
    customer = newCustomer.id

    // Update the user's profile with the Stripe customer ID
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer })
      .eq('id', userId)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${Deno.env.get('FRONTEND_URL')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('FRONTEND_URL')}/pricing`,
  })

  return new Response(JSON.stringify({ sessionId: session.id }), {
    headers: { "Content-Type": "application/json" },
  })
})
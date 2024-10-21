import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const body = await req.text()

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object

      // Retrieve the Stripe Customer ID
      const customer = await stripe.customers.retrieve(session.customer as string)

      // Get the Supabase user ID from the Stripe customer's metadata
      const userId = customer.metadata.supabase_user_id

      // Determine the plan type based on the price ID
      let planType
      if (session.line_items?.data[0]?.price.id === 'price_premium_monthly') {
        planType = 'premium'
      } else if (session.line_items?.data[0]?.price.id === 'price_lifetime') {
        planType = 'lifetime'
      } else {
        return new Response('Unknown price ID', { status: 400 })
      }

      // Update the user's profile with their new plan
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: planType })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user profile:', error)
        return new Response('Error updating user profile', { status: 500 })
      }

      break
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
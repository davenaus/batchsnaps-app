import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const requiredEnvVars = {
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  FRONTEND_URL: Deno.env.get('FRONTEND_URL'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars);
}

const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const { priceId, userId } = await req.json();
    console.log('Request data:', { priceId, userId });

    const supabase = createClient(
      requiredEnvVars.SUPABASE_URL as string,
      requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY as string
    );

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan_type')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already has lifetime access
    if (profile.plan_type === 'lifetime') {
      return new Response(JSON.stringify({ error: 'You already have lifetime access' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let customer;
    if (profile.stripe_customer_id) {
      customer = profile.stripe_customer_id;
      console.log('Using existing customer:', customer);
    } else {
      console.log('Creating new Stripe customer');
      const newCustomer = await stripe.customers.create({
        metadata: {
          supabase_user_id: userId,
        },
      });
      customer = newCustomer.id;
      console.log('Created new customer:', customer);

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer })
        .eq('id', userId);
    }

    // Check if it's a lifetime purchase based on the price ID
    const isLifetime = priceId === 'price_1QCZI5DRxLtEGzRIflAay27v';
    
    console.log('Creating checkout session with:', {
      customer,
      priceId,
      mode: isLifetime ? 'payment' : 'subscription',
    });

    const session = await stripe.checkout.sessions.create({
      customer,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isLifetime ? 'payment' : 'subscription',
      success_url: `${requiredEnvVars.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${requiredEnvVars.FRONTEND_URL}/payment-canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log('Created session:', session.id);

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Full error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
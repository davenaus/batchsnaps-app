import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log incoming request
    console.log('Incoming request body:', await req.clone().text());
    
    const { priceId, userId } = await req.json();
    console.log('Parsed request data:', { priceId, userId });

    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    console.log('Fetching user profile for:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ 
        error: 'User not found',
        details: profileError 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found profile:', profile);

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

      const updateResult = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer })
        .eq('id', userId);
      
      console.log('Profile update result:', updateResult);
    }

    // Determine checkout mode based on price ID
    const mode = priceId.includes('lifetime') ? 'payment' : 'subscription';
    console.log('Checkout mode:', mode);

    console.log('Creating checkout session with:', {
      customer,
      priceId,
      mode,
      successUrl: `${Deno.env.get('FRONTEND_URL')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${Deno.env.get('FRONTEND_URL')}/pricing`
    });

    const session = await stripe.checkout.sessions.create({
      customer,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${Deno.env.get('FRONTEND_URL')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/pricing`,
    });

    console.log('Created session:', session.id);

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Full error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      details: error 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function invoked with method:', req.method);
    
    // Check environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasStripeKey: !!stripeKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey
      });
      throw new Error('Missing required environment variables');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('User authentication error:', userError);
      throw new Error('Invalid authentication token');
    }

    if (!user) {
      throw new Error('No user found for provided token');
    }

    console.log('User found:', user.id);

    // Get the customer's stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      throw new Error('Error fetching user profile');
    }

    if (!profile?.stripe_customer_id) {
      console.error('No Stripe customer ID found for user:', user.id);
      throw new Error('No Stripe customer ID associated with user');
    }

    console.log('Found Stripe customer ID:', profile.stripe_customer_id);

    // Parse request body
    const { returnUrl } = await req.json();
    
    if (!returnUrl) {
      throw new Error('Return URL is required');
    }

    // Create Stripe session
    console.log('Creating Stripe portal session...');
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log('Stripe session created successfully');

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Edge function error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    let status = 500;
    let message = error.message || 'Internal server error';

    // Map specific errors to status codes
    if (message.includes('No authorization header')) status = 401;
    if (message.includes('Invalid authentication')) status = 401;
    if (message.includes('No Stripe customer ID')) status = 404;
    if (message.includes('Missing required environment')) status = 503;

    return new Response(
      JSON.stringify({
        error: message,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
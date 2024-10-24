import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request
    if (!req.headers.get('Authorization')) {
      throw new Error('No authorization header');
    }

    // Get user from JWT token
    const token = req.headers.get('Authorization')!.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid token or user not found');
    }

    // Get return URL from request body
    const { returnUrl } = await req.json();
    if (!returnUrl) {
      throw new Error('Return URL is required');
    }

    // Get Stripe customer ID from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      throw new Error('No Stripe customer ID found for user');
    }

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Create portal session error:', error);

    let status = 500;
    let message = 'Internal server error';

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'No authorization header') {
        status = 401;
        message = 'Unauthorized';
      } else if (error.message === 'Invalid token or user not found') {
        status = 401;
        message = 'Invalid authentication';
      } else if (error.message === 'No Stripe customer ID found for user') {
        status = 404;
        message = 'Stripe customer not found';
      }
    }

    return new Response(
      JSON.stringify({ 
        error: message,
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
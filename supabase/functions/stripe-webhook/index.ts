import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  console.log('Received webhook with signature:', signature);

  if (!signature) {
    return new Response('No signature', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.text();
    console.log('Webhook body:', body);

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    );

    console.log('Event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session:', session);

        const customer = await stripe.customers.retrieve(session.customer as string);
        console.log('Customer:', customer);

        const userId = customer.metadata.supabase_user_id;
        console.log('User ID:', userId);

        let planType;
        let isPremium;
        if (session.mode === 'subscription') {
          planType = 'premium';
          isPremium = true;
        } else if (session.mode === 'payment') {
          planType = 'lifetime';
          isPremium = true;
        } else {
          console.error('Unknown payment mode:', session.mode);
          return new Response('Unknown payment mode', { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Updating profile:', { planType, isPremium });

        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            plan_type: planType,
            is_premium: isPremium,
            stripe_customer_id: session.customer
          })
          .eq('id', userId);

        console.log('Update result:', { data, error });

        if (error) {
          console.error('Error updating user profile:', error);
          return new Response('Error updating user profile', { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from('profiles')
          .select('plan_type, is_premium, stripe_customer_id')
          .eq('id', userId)
          .single();

        console.log('Verification result:', { verifyData, verifyError });
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const canceledCustomer = await stripe.customers.retrieve(subscription.customer as string);
        const canceledUserId = canceledCustomer.metadata.supabase_user_id;

        const { error: cancelError } = await supabase
          .from('profiles')
          .update({ 
            plan_type: 'free',
            is_premium: false
          })
          .eq('id', canceledUserId);

        if (cancelError) {
          console.error('Error updating cancelled subscription:', cancelError);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(`Webhook Error: ${err.message}`, { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
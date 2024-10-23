import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRICE_IDS = {
  PREMIUM: 'price_1QCZGfDRxLtEGzRIi8jMrkVe',
  LIFETIME: 'price_1QCZI5DRxLtEGzRIflAay27v'
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

  if (!signature) {
    return new Response('No signature', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    );

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const customer = await stripe.customers.retrieve(session.customer as string);
        const userId = customer.metadata.supabase_user_id;

        let planType;
        if (session.mode === 'subscription') {
          planType = 'premium';
        } else if (session.mode === 'payment') {
          planType = 'lifetime';
        } else {
          return new Response('Unknown payment mode', { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Updating profile for user:', userId, 'to plan:', planType);

        const { error } = await supabase
          .from('profiles')
          .update({ plan_type: planType })
          .eq('id', userId);

        if (error) {
          console.error('Error updating user profile:', error);
          return new Response('Error updating user profile', { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const deletedCustomer = await stripe.customers.retrieve(subscription.customer as string);
        const deletedUserId = deletedCustomer.metadata.supabase_user_id;

        console.log('Subscription cancelled for user:', deletedUserId);

        const { error: deleteError } = await supabase
          .from('profiles')
          .update({ plan_type: 'free' })
          .eq('id', deletedUserId);

        if (deleteError) {
          console.error('Error updating user profile after cancellation:', deleteError);
          return new Response('Error updating user profile', { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Payment failed for invoice:', failedInvoice.id);
        // You might want to notify the user or take other actions
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
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
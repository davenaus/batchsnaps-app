import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Add your Stripe Price IDs here
const PRICE_IDS = {
  PREMIUM: 'prod_R4ii70QuQUjuaY', // Replace with your Premium price ID
  LIFETIME: 'prod_R4ij23jzPsQr1W'  // Replace with your Lifetime price ID
};

const PricingSection = () => {
  const navigate = useNavigate();

  const handlePurchase = async (priceId) => {
    try {
      console.log('Starting purchase process for:', priceId);
      
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        console.log('No session found, redirecting to signin');
        navigate(`/signin?returnUrl=${encodeURIComponent(`/pricing?priceId=${priceId}`)}`);
        return;
      }
  
      const userId = session.data.session.user.id;
      console.log('User ID:', userId);
  
      console.log('Invoking checkout function with:', { priceId, userId });
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: JSON.stringify({ priceId, userId }),
      });
  
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
  
      if (!data?.sessionId) {
        console.error('No session ID returned:', data);
        throw new Error('Invalid response from server');
      }
  
      console.log('Got session ID:', data.sessionId);
      const stripe = await stripePromise;
      
      console.log('Redirecting to checkout...');
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
  
      if (stripeError) {
        console.error('Stripe redirect error:', stripeError);
        throw stripeError;
      }
    } catch (error) {
      console.error('Full error details:', error);
      alert(`Error: ${error.message}. Please try again or contact support.`);
    }
  };

  return (
    <section className="splashpage-pricing-section">
      <h2 className="splashpage-section-title">Flexible Pricing Plans</h2>
      <div className="splashpage-pricing-grid">
        <div className="splashpage-pricing-card splashpage-fade-in-up" style={{animationDelay: '0.6s'}}>
          <h3 className="splashpage-plan-name">Free</h3>
          <p className="splashpage-plan-description">Essential tools for quick edits</p>
          <div className="splashpage-plan-price">$0<span>/month</span></div>
          <ul className="splashpage-plan-features">
            <li><i className='bx bx-check mr-2'></i>Edit up to 5 images per batch</li>
            <li><i className='bx bx-check mr-2'></i>Basic editing tools</li>
            <li><i className='bx bx-check mr-2'></i>Standard export quality</li>
          </ul>
          <button className="splashpage-plan-cta">Current Plan</button>
        </div>

        <div className="splashpage-pricing-card highlighted splashpage-fade-in-up" style={{animationDelay: '0.8s'}}>
          <h3 className="splashpage-plan-name">Premium</h3>
          <p className="splashpage-plan-description">Advanced features for professionals</p>
          <div className="splashpage-plan-price">$2.99<span>/month</span></div>
          <ul className="splashpage-plan-features">
            <li><i className='bx bx-check mr-2'></i>Unlimited batch size</li>
            <li><i className='bx bx-check mr-2'></i>Advanced editing features</li>
            <li><i className='bx bx-check mr-2'></i>High-quality exports</li>
            <li><i className='bx bx-check mr-2'></i>Priority support</li>
          </ul>
          <button 
            className="splashpage-plan-cta btn-premium" 
            onClick={() => handlePurchase(PRICE_IDS.PREMIUM)}
          >
            Go Premium
          </button>
        </div>

        <div className="splashpage-pricing-card splashpage-fade-in-up" style={{animationDelay: '1s'}}>
          <h3 className="splashpage-plan-name">Lifetime Access</h3>
          <p className="splashpage-plan-description">One-time payment for unlimited access</p>
          <div className="splashpage-plan-price">$19.99</div>
          <ul className="splashpage-plan-features">
            <li><i className='bx bx-check mr-2'></i>All Premium features</li>
            <li><i className='bx bx-check mr-2'></i>One-time payment</li>
            <li><i className='bx bx-check mr-2'></i>Lifetime updates</li>
            <li><i className='bx bx-check mr-2'></i>Exclusive features</li>
          </ul>
          <button 
            className="splashpage-plan-cta" 
            onClick={() => handlePurchase(PRICE_IDS.LIFETIME)}
          >
            Get Lifetime Access
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
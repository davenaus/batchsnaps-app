import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SignIn.css';

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        handlePostSignIn(session);
      }
    });

    return () => {
      if (authListener && authListener.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, [navigate, location]);

  const handlePostSignIn = async (session) => {
    const params = new URLSearchParams(location.search);
    const returnUrl = params.get('returnUrl');

    if (returnUrl && returnUrl.startsWith('/pricing')) {
      const priceId = new URLSearchParams(returnUrl.split('?')[1]).get('priceId');
      if (priceId) {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: JSON.stringify({ priceId, userId: session.user.id }),
        });

        if (error) {
          console.error('Error:', error);
          return;
        }

        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        navigate(returnUrl);
      }
    } else {
      navigate(returnUrl || '/editor');
    }
  };

  const handleSignIn = async (provider) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/signin${location.search}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-in-container">
      <h1>Sign in to BatchSnaps</h1>
      <p>Choose your preferred sign-in method:</p>
      <div className="sign-in-buttons">
        <button 
          className="sign-in-button google" 
          onClick={() => handleSignIn('google')} 
          disabled={loading}
        >
          <i className='bx bxl-google'></i> Sign in with Google
        </button>
        {/* Add more sign-in options as needed */}
      </div>
      <p className="sign-in-info">
        By signing in, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
};

export default SignIn;
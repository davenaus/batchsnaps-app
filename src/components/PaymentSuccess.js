import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const { data: profile } = await supabase.auth.getUser();
        
        if (!profile.user) {
          navigate('/signin');
          return;
        }

        // Wait a moment for webhook to process
        setTimeout(() => {
          navigate('/editor');
        }, 3000);

      } catch (error) {
        console.error('Error:', error);
        setStatus('error');
      }
    };

    checkStatus();
  }, [navigate, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
      {status === 'loading' && (
        <p>Processing your payment... You'll be redirected shortly.</p>
      )}
      {status === 'error' && (
        <p>There was an error processing your payment. Please contact support.</p>
      )}
    </div>
  );
};

export default PaymentSuccess;
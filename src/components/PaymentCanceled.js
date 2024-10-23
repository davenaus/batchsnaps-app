import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Canceled</h1>
      <p className="mb-4">Your payment was canceled. No charges were made.</p>
      <button
        onClick={() => navigate('/pricing')}
        className="splashpage-plan-cta"
      >
        Return to Pricing
      </button>
    </div>
  );
};

export default PaymentCanceled;
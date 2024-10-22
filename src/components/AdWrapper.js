import React from 'react';
import { useEffect } from 'react';

function AdWrapper({ children, isPremium }) {
  useEffect(() => {
    if (!isPremium) {
      try {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.onerror = () => {
          console.log('Ad script failed to load - continuing without ads');
        };
        document.body.appendChild(script);

        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.log('Ad setup error:', error);
      }
    }
  }, [isPremium]);

  // Premium users see no ads
  if (isPremium) {
    return children;
  }

  return (
    <div className="ad-wrapper">
      <div className="ad-left">
        <ins className="adsbygoogle"
          style={{
            display: 'block',
            width: '160px',
            height: '600px',
            position: 'fixed',
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          data-ad-client="YOUR-AD-CLIENT-ID"
          data-ad-slot="YOUR-AD-SLOT-ID"
          data-ad-format="vertical"/>
      </div>
      <div className="main-content">
        {children}
      </div>
      <div className="ad-right">
        <ins className="adsbygoogle"
          style={{
            display: 'block',
            width: '160px',
            height: '600px',
            position: 'fixed',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          data-ad-client="YOUR-AD-CLIENT-ID"
          data-ad-slot="YOUR-AD-SLOT-ID"
          data-ad-format="vertical"/>
      </div>
    </div>
  );
}

export default AdWrapper;
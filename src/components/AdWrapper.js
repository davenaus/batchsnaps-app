import React from 'react';
import { useEffect } from 'react';

function AdWrapper({ children, isPremium }) {
  useEffect(() => {
    if (!isPremium) {
      // Load Google Ads script
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isPremium]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="ad-wrapper">
      <div className="ad-left">
        {/* Google Ad Component */}
        <ins className="adsbygoogle"
             style={{display: 'block'}}
             data-ad-client="YOUR-AD-CLIENT-ID"
             data-ad-slot="YOUR-AD-SLOT-ID"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
      <div className="main-content">
        {children}
      </div>
      <div className="ad-right">
        {/* Google Ad Component */}
        <ins className="adsbygoogle"
             style={{display: 'block'}}
             data-ad-client="YOUR-AD-CLIENT-ID"
             data-ad-slot="YOUR-AD-SLOT-ID"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}

export default AdWrapper;
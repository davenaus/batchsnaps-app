import React from 'react';
import { useEffect } from 'react';

function AdWrapper({ children, isPremium }) {
  useEffect(() => {
    if (!isPremium) {
      try {
        // Load Google Ads script
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.onerror = (error) => {
          console.log('Ad script failed to load:', error);
          // Continue silently - don't let ad errors break the app
        };
        document.body.appendChild(script);

        // Initialize ads
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (adsError) {
          console.log('Ads initialization error:', adsError);
        }

        return () => {
          // Clean up script only if it was successfully added
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.log('General ad setup error:', error);
        // Continue silently
      }
    }
  }, [isPremium]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="ad-wrapper">
      <div className="ad-left">
        {!isPremium && (
          <div style={{ minHeight: '600px', width: '160px' }}>
            {/* Google Ad Component */}
            <ins className="adsbygoogle"
                style={{display: 'block'}}
                data-ad-client="YOUR-AD-CLIENT-ID"
                data-ad-slot="YOUR-AD-SLOT-ID"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
          </div>
        )}
      </div>
      <div className="main-content">
        {children}
      </div>
      <div className="ad-right">
        {!isPremium && (
          <div style={{ minHeight: '600px', width: '160px' }}>
            {/* Google Ad Component */}
            <ins className="adsbygoogle"
                style={{display: 'block'}}
                data-ad-client="YOUR-AD-CLIENT-ID"
                data-ad-slot="YOUR-AD-SLOT-ID"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdWrapper;
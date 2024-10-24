import React, { useEffect, useState } from 'react';

function AdWrapper({ children, isPremium }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 1024);
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't load ads for premium users or mobile
  if (isPremium || isMobile) {
    return <div style={{ width: '100%' }}>{children}</div>;
  }

  // Initialize ads for desktop
  useEffect(() => {
    if (!isPremium && !isMobile) {
      try {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.onerror = () => {
          console.log('Ad script failed to load - continuing without ads');
        };
        document.body.appendChild(script);

        // Initialize ads
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (adsError) {
          console.log('Ads initialization error:', adsError);
        }

        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.log('Ad setup error:', error);
      }
    }
  }, [isPremium, isMobile]);

  return (
    <div style={{ display: 'flex', width: '100%', position: 'relative' }}>
      {!isMobile && (
        <div style={{
          width: '160px',
          minHeight: '600px',
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 999,
          display: isMobile ? 'none' : 'block'
        }}>
          <ins className="adsbygoogle"
            style={{
              display: 'block',
              width: '160px',
              height: '600px'
            }}
            data-ad-client="YOUR-AD-CLIENT-ID"
            data-ad-slot="YOUR-AD-SLOT-ID"
            data-ad-format="vertical" />
        </div>
      )}
      
      <div style={{ 
        flex: 1,
        margin: isMobile ? '0' : '0 160px',
        width: '100%',
        maxWidth: isMobile ? '100%' : 'calc(100% - 320px)'
      }}>
        {children}
      </div>

      {!isMobile && (
        <div style={{
          width: '160px',
          minHeight: '600px',
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 999,
          display: isMobile ? 'none' : 'block'
        }}>
          <ins className="adsbygoogle"
            style={{
              display: 'block',
              width: '160px',
              height: '600px'
            }}
            data-ad-client="YOUR-AD-CLIENT-ID"
            data-ad-slot="YOUR-AD-SLOT-ID"
            data-ad-format="vertical" />
        </div>
      )}
    </div>
  );
}

export default AdWrapper;
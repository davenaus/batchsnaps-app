import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SplashPage.css';
import 'boxicons/css/boxicons.min.css';
import PricingSection from './PricingSection';

const SplashPage = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  const handleTryItFree = () => {
    navigate('/editor');
  };

  return (
    <div className="splashpage">
      <div className="splashpage-container">
        <header className="splashpage-header">
          <div className="splashpage-logo">BatchSnaps</div>
          <button className="splashpage-sign-in-button" onClick={handleGoogleSignIn}>
            <i className='bx bxl-google mr-2'></i> Sign in with Google
          </button>
        </header>

        <main>
          <section className="splashpage-hero-section">
            <h1 className="splashpage-title splashpage-fade-in-up">Batch edit your photos with ease</h1>
            <p className="splashpage-subtitle splashpage-fade-in-up" style={{animationDelay: '0.2s'}}>Streamline your workflow and enhance multiple images simultaneously</p>
            <button className="splashpage-cta-button splashpage-fade-in-up" style={{animationDelay: '0.4s'}} onClick={handleTryItFree}>
              <i className='bx bx-play mr-2'></i> Try It Free
            </button>
            <img src="https://64.media.tumblr.com/ffd3b83f8b484b165ded66cd769f93de/1207060fbc8b88f7-13/s1280x1920/8f822c9bbe48e77243c386cff2c99bcc78b7f503.pnj" alt="BatchSnap Interface" className="splashpage-hero-image" />
          </section>
          <section className="splashpage-features-section">
            <h2 className="splashpage-section-title">Key Features</h2>
            <div className="splashpage-feature-grid">
              {features.map((feature, index) => (
                <div key={index} className="splashpage-feature-card splashpage-fade-in-up" style={{animationDelay: `${0.2 * (index + 1)}s`}}>
                  <i className={`bx ${feature.icon} splashpage-feature-icon`}></i>
                  <h3 className="splashpage-feature-title">{feature.title}</h3>
                  <p className="splashpage-feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <PricingSection />
        </main>

        <footer className="splashpage-footer">
          <div className="splashpage-container">
            <div className="splashpage-footer-grid">
              <div>
                <h3>Company</h3>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press</a></li>
                </ul>
              </div>
              <div>
                <h3>Legal</h3>
                <ul>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                </ul>
              </div>
              <div>
                <h3>Connect</h3>
                <div className="splashpage-social-icons">
                  <a href="#"><i className='bx bxl-facebook-circle'></i></a>
                  <a href="#"><i className='bx bxl-twitter'></i></a>
                  <a href="#"><i className='bx bxl-instagram'></i></a>
                  <a href="#"><i className='bx bxl-linkedin'></i></a>
                </div>
              </div>
            </div>
            <div className="splashpage-footer-copyright">
              <p>&copy; 2024 BatchSnaps. All rights reserved.</p>
            </div>
          </div>
          </footer>
      </div>
    </div>
  );
};

const features = [
  { title: "Bulk Processing", description: "Edit up to 100 images at once, saving you time and effort", icon: 'bx-images' },
  { title: "Advanced Editing", description: "Apply filters, adjust colors, resize, and more with our powerful tools", icon: 'bx-edit' },
  { title: "Multiple Formats", description: "Export your edited images in various formats to suit your needs", icon: 'bx-file' },
  { title: "Custom Presets", description: "Create and save your own editing presets for quick application", icon: 'bx-slider' },
];

export default SplashPage;
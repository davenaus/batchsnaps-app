import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PricingSection from './PricingSection';
import './SplashPage.css'; // Reusing the same styles

const PricingPage = () => {
  const navigate = useNavigate();

  const handleBackToEditor = () => {
    navigate('/editor');
  };

  return (
    <div className="splashpage">
      <div className="splashpage-container">
        <header className="splashpage-header">
          <Link to="/" className="splashpage-logo">BatchSnaps</Link>
          <button onClick={handleBackToEditor} className="splashpage-sign-in-button">
            Back to Editor
          </button>
        </header>

        <main>
          <section className="splashpage-hero-section">
            <h1 className="splashpage-title splashpage-fade-in-up">Choose the Right Plan for You</h1>
            <p className="splashpage-subtitle splashpage-fade-in-up" style={{animationDelay: '0.2s'}}>
              Unlock the full potential of BatchSnaps with our flexible pricing options
            </p>
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

export default PricingPage;
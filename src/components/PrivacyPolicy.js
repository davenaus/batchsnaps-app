import React from 'react';
import { Link } from 'react-router-dom';
import './SplashPage.css';

const PrivacyPolicy = () => {
  return (
    <div className="splashpage">
      <div className="splashpage-container">
        <header className="splashpage-header">
          <Link to="/" className="splashpage-logo">BatchSnaps</Link>
          <Link to="/editor" className="splashpage-sign-in-button">
            Back to Editor
          </Link>
        </header>

        <main className="privacy-content">
          <h1>Privacy Policy</h1>
          <p className="intro">Welcome to BatchSnaps! This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website and tool for batch editing photos. By using our tool, you agree to the collection and use of information in accordance with this policy.</p>

          <section>
            <h2>1. Information We Collect</h2>
            <ul>
              <li><strong>Personal Information:</strong> When you sign up for BatchSnaps, we collect your email address and other necessary information to create and manage your account.</li>
              <li><strong>Usage Information:</strong> We collect information about how you interact with our tool, including the features you use and the time you spend using it.</li>
              <li><strong>Payment Information:</strong> While BatchSnaps does not store payment details on its servers, payments for any future subscription plans will be processed by third-party payment processors like Stripe. Stripe may collect and store payment information in accordance with its privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <ul>
              <li><strong>To Provide and Improve Our Services:</strong> We use your information to operate, maintain, and enhance the BatchSnaps tool, ensuring the best possible user experience.</li>
              <li><strong>To Communicate With You:</strong> We may use your email to send updates, promotional materials, or notifications related to our service.</li>
              <li><strong>To Analyze Usage:</strong> We use your usage information to better understand how users interact with BatchSnaps and to make improvements where necessary.</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Storage and Security</h2>
            <p>We store user data such as email addresses securely and take appropriate measures to protect it from unauthorized access, alteration, disclosure, or destruction.</p>
            <p>We do not store or retain the photos you upload to BatchSnaps. All photo uploads and edits are processed in real-time and are not saved on our servers once the editing session is complete.</p>
          </section>

          <section>
            <h2>4. Sharing Your Information</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to outside parties without your consent, except in the following cases:</p>
            <ul>
              <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers, such as payment processors (e.g., Stripe), who assist in operating our services.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
            </ul>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <ul>
              <li><strong>Access and Update:</strong> You have the right to access and update your personal information at any time through your account settings.</li>
              <li><strong>Delete:</strong> You can request the deletion of your personal information, subject to certain legal exceptions.</li>
              <li><strong>Opt-Out:</strong> You can opt out of receiving promotional communications from us by following the unsubscribe instructions included in those communications.</li>
            </ul>
          </section>

          <section>
            <h2>6. Third-Party Links</h2>
            <p>BatchSnaps may contain links to third-party websites. We are not responsible for the privacy practices or the content of those third-party websites. We encourage you to review their privacy policies before sharing any personal information.</p>
          </section>

          <section>
            <h2>7. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page, and we will notify you of significant updates via email or through notifications on our website. You are encouraged to review this Privacy Policy periodically for any changes.</p>
          </section>

          <section>
            <h2>8. Contact Information</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
            <p><strong>Email:</strong> youtool.io.business@gmail.com</p>
          </section>
        </main>

        <footer className="splashpage-footer">
          <div className="splashpage-footer-copyright">
            <p>&copy; 2024 BatchSnaps. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
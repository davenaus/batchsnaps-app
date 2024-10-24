import React from 'react';
import { Link } from 'react-router-dom';
import './SplashPage.css';

const TermsConditions = () => {
  return (
    <div className="splashpage">
      <div className="splashpage-container">
        <header className="splashpage-header">
          <Link to="/" className="splashpage-logo">BatchSnaps</Link>
          <Link to="/editor" className="splashpage-sign-in-button">
            Back to Editor
          </Link>
        </header>

        <main className="terms-content">
          <h1>Terms & Conditions</h1>
          <p className="intro">Welcome to BatchSnaps! These Terms & Conditions govern your use of our website and tool for batch editing photos. By accessing or using our tool, you agree to be bound by these Terms & Conditions.</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using BatchSnaps, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, you should not use our tool.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>BatchSnaps allows users to upload multiple photos, apply edits such as resizing, cropping, filtering, and exporting them efficiently. Our tool is designed to streamline the photo editing process by allowing batch processing of images.</p>
          </section>

          <section>
            <h2>3. User Responsibilities</h2>
            <p>You are responsible for ensuring that any content you upload does not violate any third-party rights, including copyright, trademark, privacy, or other personal or proprietary rights.</p>
            <p>You agree not to use our tool for any unlawful or prohibited activities, including but not limited to distributing harmful, offensive, or infringing content.</p>
          </section>

          <section>
            <h2>4. Intellectual Property</h2>
            <p>All content, features, and functionality on our tool, including but not limited to text, graphics, logos, and software, are the exclusive property of BatchSnaps and are protected by international copyright, trademark, and other intellectual property or proprietary rights laws.</p>
            <p>You retain all rights to the content you upload. BatchSnaps does not store or collect your photos beyond the immediate processing required to provide the service. Once the editing process is complete, your content is not retained by our system. However, BatchSnaps may store your email address or other necessary personal information associated with your account.</p>
          </section>

          <section>
            <h2>5. Privacy Policy</h2>
            <p>We store personal information such as your email address associated with your account for the purposes of providing access to our services and managing your subscription. We do not store or retain any of your photos or content after they are processed and exported.</p>
          </section>

          <section>
            <h2>6. Limitation of Liability</h2>
            <p>BatchSnaps is provided on an "as is" and "as available" basis. To the fullest extent permitted by law, BatchSnaps disclaims all warranties, express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose. BatchSnaps does not guarantee the service will be uninterrupted or error-free.</p>
          </section>

          <section>
            <h2>7. Indemnification</h2>
            <p>You agree to indemnify and hold harmless BatchSnaps, its affiliates, and their respective officers, directors, employees, agents, and representatives from any claims, liabilities, damages, losses, and expenses, including without limitation reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the tool or your violation of these Terms & Conditions.</p>
          </section>

          <section>
            <h2>8. Modifications to the Service</h2>
            <p>BatchSnaps reserves the right to modify or discontinue, temporarily or permanently, the tool or any features or portions thereof without prior notice. You agree that BatchSnaps shall not be held responsible for any interruptions in service, changes, suspensions, or discontinuance of the tool or any part thereof.</p>
          </section>

          <section>
            <h2>9. Governing Law</h2>
            <p>These Terms & Conditions are governed by and construed in accordance with the laws of the State of Tennessee, without regard to its conflict of law principles. Any disputes arising out of or related to these Terms & Conditions or the use of BatchSnaps shall be subject to the exclusive jurisdiction of the courts in Tennessee.</p>
          </section>

          <section>
            <h2>10. Contact Information</h2>
            <p>If you have any questions or concerns regarding these Terms & Conditions, please contact us at:</p>
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

export default TermsConditions;
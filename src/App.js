import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import SplashPage from './components/SplashPage';
import EditorContainer from './components/EditorContainer';
import PricingPage from './components/PricingPage';
import SignIn from './components/SignIn';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('App component mounting'); // Debug log
  const [session, setSession] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  
  const checkAndCreateProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: { user } } = await supabase.auth.getUser();
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              full_name: user.user_metadata.full_name,
              avatar_url: user.user_metadata.avatar_url,
              username: user.email,
              is_premium: false
            }
          ]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      } else if (error) {
        console.error('Error checking profile:', error);
      }
    } catch (error) {
      console.error('Error in checkAndCreateProfile:', error);
    }
  };

  useEffect(() => {
    console.log('App useEffect running'); // Debug log
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session data:', session); // Debug log
      setSession(session);
      if (session) {
        checkAndCreateProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session); // Debug log
      setSession(session);
      if (session) {
        checkAndCreateProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      console.log('Attempting sign in'); // Debug log
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/editor'
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error); // Debug log
      alert(error.error_description || error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Attempting sign out'); // Debug log
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      // Redirect to splash page after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error); // Debug log
      alert(error.error_description || error.message);
    }
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={
            session ? <Navigate to="/editor" /> : <SplashPage onSignIn={handleSignIn} />
          } />
          <Route path="/editor" element={
            <EditorContainer 
              key="editor-container" // Added key for proper mounting
              session={session}
              images={images}
              setImages={setImages}
              currentImageIndex={currentImageIndex}
              setCurrentImageIndex={setCurrentImageIndex}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
            />
          } />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
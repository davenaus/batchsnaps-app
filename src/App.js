import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import SplashPage from './components/SplashPage';
import EditorContainer from './components/EditorContainer';
import PricingPage from './components/PricingPage';
import SignIn from './components/SignIn';

function App() {
  const [session, setSession] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  
  const checkAndCreateProfile = async (userId) => {
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
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAndCreateProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAndCreateProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/editor'
        }
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      // Redirect to splash page after sign out
      window.location.href = '/';
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          session ? <Navigate to="/editor" /> : <SplashPage onSignIn={handleSignIn} />
        } />
        <Route path="/editor" element={
          <EditorContainer 
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
  );
}

export default App;
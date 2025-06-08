// File: frontend/src/pages/OAuthSuccessPage.tsx

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const OAuthSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken, user, isAuthenticated } = useAuth();

  // Step 1: Handle token and login
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      (async () => {
        try {
          await loginWithToken(token);
          // Redirect will happen once isAuthenticated becomes true
        } catch (err) {
          console.warn('OAuth login failed:', err);
          navigate('/login');
        }
      })();
    } else {
      navigate('/login');
    }
  }, [searchParams, loginWithToken, navigate]);

  // Step 2: Once logged in, redirect based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'doctor') {
        navigate('/doc-dashboard');
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-lg font-medium text-white">
      Logging you in…
    </div>
  );
};

export default OAuthSuccessPage;

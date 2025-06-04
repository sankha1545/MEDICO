// File: frontend/src/pages/OAuthSuccessPage.tsx

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the raw search string
    console.log('OAuthSuccessPage search:', window.location.search);

    // Extract "token" from ?token=...
    const token = searchParams.get('token');
    console.log('Parsed token:', token);

    if (token) {
      // Store it (or save in context)
      localStorage.setItem('authToken', token);

      // Redirect to /dashboard
      navigate('/');
    } else {
      // No token → go back to /login
      console.warn('No token found, redirecting to login');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Logging you in…</div>;
};

export default OAuthSuccessPage;

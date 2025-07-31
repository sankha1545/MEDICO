// File: src/App.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import { Layout } from './frontend/components/layout/patient/Layout';
import { Layout1 } from './frontend/components/layout/doctor/Layout';

// Patient pages
import HomePage from './frontend/pages/patient/HomePage';
import LoginPage from './frontend/Auth/LoginPage';
import SignupPage from './frontend/Auth/SignupPage';
import OTPVerificationPage from './frontend/Auth/VerifyEmailOtp';
import OAuthSuccessPage from './frontend/pages/patient/OAuthSuccessPage';
import DashboardPage from './frontend/pages/patient/DashboardPage';
import DoctorsPage from './frontend/pages/patient/DoctorsPage';

import NotFoundPage from './frontend/pages/patient/NotFoundPage';
import Services from './frontend/pages/patient/services';
import About from './frontend/pages/patient/About';
import Contact from './frontend/pages/patient/Contact';
import Profile from './frontend/components/common/profile';
import FAQ from './frontend/components/footerlinks/FAQ';
import HealthBlog from './frontend/components/footerlinks/HealthBlog';
import TOS from './frontend/components/footerlinks/TermsOfService';
import HelpCenter from './frontend/components/footerlinks/HelpCentre';


// Doctor pages

import DashboardPage1 from './frontend/pages/doctor/Dashboard';


// Common
import PrivacyPolicy from './frontend/components/footerlinks/PrivacyPolicy';


import PaymentPage from './frontend/pages/patient/paymentspage';
import AnimatedCursor from './frontend/components/common/cursor';
import { ToastContainer } from 'react-toastify';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AnimatedCursor />
      <ToastContainer />

      <Routes>
        {/* Default: Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ─── Authentication ─── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email-otp" element={<OTPVerificationPage />} />
        <Route path="/oauth-success" element={<OAuthSuccessPage />} />

        {/* ─── Public patient pages ─── */}
        <Route
          path="/home"
          element={
            <Layout fullWidth>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/doctors"
          element={
            <Layout>
              <DoctorsPage />
            </Layout>
          }
        />
        <Route
          path="/services"
          element={
            <Layout>
              <Services />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/tos" element={<TOS />} />
        <Route path="/blog" element={<HealthBlog />} />
        <Route path="/helpcentre" element={<HelpCenter />} />

        {/* ─── Protected patient routes ─── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
    
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
       
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        {/* ─── Doctor pages ─── */}
        
        <Route
          path="/doc-dashboard"
          element={
            <ProtectedRoute>
              <Layout1>
                <DashboardPage1 />
              </Layout1>
            </ProtectedRoute>
          }
        />
       

        {/* ─── Utility & Fallback ─── */}
       
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;

// File: src/App.tsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import AppointmentBookingPage from './frontend/pages/patient/AppointmentBookingPage';
import NotFoundPage from './frontend/pages/patient/NotFoundPage';
import Services from './frontend/pages/patient/services';
import About from './frontend/pages/patient/About';
import Contact from './frontend/pages/patient/Contact';
import Profile from './frontend/components/common/profile';
import FAQ from './frontend/components/footerlinks/FAQ';
import HealthBlog from './frontend/components/footerlinks/HealthBlog';
import TOS from './frontend/components/footerlinks/TermsOfService';
import HelpCenter from './frontend/components/footerlinks/HelpCentre';
import Docpatient from './frontend/pages/doctor/PatientAdmission';

// Doctor pages
import HomePage1 from './frontend/pages/doctor/HomePage';
import DashboardPage1 from './frontend/pages/doctor/Dashboard';
import SettingsPage from './frontend/components/common/settingspage';

// Common
import LandingPage from './frontend/pages/LandingPage/LandingPage';
import ChakraTransition from './frontend/components/animations/ChakraTransition';

import PrivacyPolicy from './frontend/components/footerlinks/PrivacyPolicy';
import Glimpse from './frontend/components/ProjectGlimpse';
import PatientSettingsPage from './frontend/components/common/settingsdoc';
import LoadingScreen from './frontend/components/common/LoadingScreen/LoadingScreen';
import PaymentPage from './frontend/pages/patient/paymentspage';
import AnimatedCursor from './frontend/components/common/cursor';
import { ToastContainer } from 'react-toastify';

// A simple wrapper to guard protected routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  // 1) Global “app loading” (e.g. checking token)
  const [appLoading, setAppLoading] = useState(true);

  // 2) Initial splash sequence: landing → chakra → login
  const [currentPage, setCurrentPage] = useState<
    'landing' | 'chakra' | 'login'
  >('landing');

  // Simulate minimal loading
  useEffect(() => {
    const t = setTimeout(() => setAppLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Handlers for the splash flow
  const navigateToChakra = () => setCurrentPage('chakra');
  const handleChakraComplete = () => setCurrentPage('login');
  const navigateToLanding = () => setCurrentPage('landing');

  // 1️⃣ Show global loading screen first
  if (appLoading) {
    return <LoadingScreen message="Welcome to MedicoX…" />;
  }

  // 2️⃣ Run the three‑step splash flow before mounting Router
  if (currentPage === 'landing') {
    return <LandingPage onNavigateToLogin={navigateToChakra} />;
  }
  if (currentPage === 'chakra') {
    return <ChakraTransition onComplete={handleChakraComplete} />;
  }

  // 3️⃣ Once we’re at “login”, mount the real app
  return (
    <AuthProvider>
      <AnimatedCursor />
      <ToastContainer />
      <div className="cursor">
        <Routes>
          {/* ─── Authentication ─── */}
          <Route
            path="/login"
            element={
              <LoginPage onNavigateBack={navigateToLanding} />
            }
          />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/verify-email-otp"
            element={<OTPVerificationPage />}
          />
          <Route
            path="/oauth-success"
            element={<OAuthSuccessPage />}
          />

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
         
          <Route
            path="/faq"
            element={
             
                <FAQ />
              
            }
          />
          <Route
            path="/privacypolicy"
            element={
             
                <PrivacyPolicy />
             
            }
          />
          <Route
            path="/tos"
            element={
              
                <TOS />
             
            }
          />
          <Route
            path="/blog"
            element={
             
                <HealthBlog />
             
            }
          />
          <Route
            path="/helpcentre"
            element={
             
                <HelpCenter />
             
            }
          />

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
            path="/book-appointment"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppointmentBookingPage />
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
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <PatientSettingsPage onBack={() => window.history.back()} />
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
            path="/doc-home"
            element={
              <Layout1>
                <HomePage1 />
              </Layout1>
            }
          />
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
          <Route
            path="/doc-settings"
            element={
              <ProtectedRoute>
                <Layout1>
                  <SettingsPage onBack={() => window.history.back()} />
                </Layout1>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doc-patient"
            element={
              <Layout1>
                <Docpatient />
              </Layout1>
            }
          />

          {/* Utility & Fallback */}
          <Route path="/glimpse" element={<Glimpse />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;

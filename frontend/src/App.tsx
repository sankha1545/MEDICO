// File: src/App.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import { Layout } from './frontend/components/layout/patient/Layout';
import { Layout1 } from './frontend/components/layout/doctor/Layout';

// Pages — patient
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
import HelpCenter from './frontend/components/footerlinks/HelpCentre'; // Ensure 'default' export or correct import style
import Docpatient from './frontend/pages/doctor/PatientAdmission'
// Pages — doctor
import HomePage1 from './frontend/pages/doctor/HomePage';
import DashboardPage1 from './frontend/pages/doctor/Dashboard';
import SettingsPage from './frontend/components/common/settingspage';

// Common
import Bookappointment from './frontend/components/common/bookappointment/bookappointment';
import PrivacyPolicy from './frontend/components/footerlinks/PrivacyPolicy';

// Patient Settings
import PatientSettingsPage from './frontend/components/common/settingsdoc';

// Payment page (new)
import PaymentPage from './frontend/pages/patient/paymentspage';
import AnimatedCursor from './frontend/components/common/cursor';
// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => (
  
  <AuthProvider>
   
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public patient pages */}
      <Route
        path="/home"
        element={
          <Layout fullWidth>
            <HomePage />
          </Layout>
        }
      />

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email-otp" element={<OTPVerificationPage />} />

      {/* OAuth Success */}
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />

      {/* More public patient pages */}
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
      <Route path="/bookappointment" element={<Bookappointment />} />

      {/* FAQ and Health Blog (public) */}
      <Route
        path="/faq"
        element={
          <Layout>
            <FAQ />
          </Layout>
        }
      />
      <Route
        path="/privacypolicy"
        element={
          <Layout>
            <PrivacyPolicy />
          </Layout>
        }
      />
      <Route
        path="/tos"
        element={
          <Layout>
            <TOS />
          </Layout>
        }
      />
      <Route
        path="/blog"
        element={
          <Layout>
            <HealthBlog />
          </Layout>
        }
      />
      <Route
        path="/helpcentre"
        element={
          <Layout>
            <HelpCenter />
          </Layout>
        }
      />

      {/* ─── Protected patient-only routes ─── */}
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

      {/* Patient Settings page */}
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

      {/* Payment page (protected) */}
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentPage />
            </Layout>
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
              <SettingsPage onBack={() => { window.history.back(); }} />
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

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </AuthProvider>
);

export default App;

// src/App.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Layouts
import { Layout } from './frontend/components/layout/patient/Layout'
import { Layout1 } from './frontend/components/layout/doctor/Layout'

// Pages — patient
import HomePage from './frontend/pages/patient/HomePage'
import LoginPage from './frontend/pages/patient/LoginPage'
import SignupPage from './frontend/pages/patient/SignupPage'
import VerifyEmailOtpPage from './frontend/pages/patient/VerifyEmailOtp'   // ← OTP page
import DashboardPage from './frontend/pages/patient/DashboardPage'
import DoctorsPage from './frontend/pages/patient/DoctorsPage'
import AppointmentBookingPage from './frontend/pages/patient/AppointmentBookingPage'
import NotFoundPage from './frontend/pages/patient/NotFoundPage'
import Services from './frontend/pages/patient/services'
import About from './frontend/pages/patient/About'
import Contact from './frontend/pages/patient/Contact'

// Pages — doctor
import HomePage1 from './frontend/pages/doctor/HomePage'
import DashboardPage1 from './frontend/pages/doctor/Dashboard'

// Common
import Bookappointment from './frontend/components/common/bookappointment'

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const App: React.FC = () => (
  <AuthProvider>
    <Routes>
      {/* Redirect root to patient home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public patient pages */}
      <Route
        path="/home"
        element={
          <Layout fullWidth>
            <HomePage />
          </Layout>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* OTP Verification page (public) */}
      <Route path="/verify-email-otp" element={<VerifyEmailOtpPage />} />

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

      {/* Protected patient-only */}
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

      {/* Doctor pages */}
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
          <Layout1>
            <DashboardPage1 />
          </Layout1>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  </AuthProvider>
)

export default App

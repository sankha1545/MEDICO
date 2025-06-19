import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import { ToastProvider } from './contexts/ToastContext.tsx';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
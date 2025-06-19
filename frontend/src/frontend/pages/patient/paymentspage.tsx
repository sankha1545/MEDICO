// File: frontend/src/pages/PaymentPage.tsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import ThreeBackground from '../../components/payments/ThreeBackground';
import Toast from '../../components/payments/Toast';
import jsPDF from 'jspdf';

interface LocationState {
  doctorId?: string;
  datetime?: string;   // ISO string
  doctorName?: string; // optional
  message?: string;    // optional extra message
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const doctorId = state?.doctorId;
  const slotDatetime = state?.datetime; // ISO string
  const initialDoctorName = state?.doctorName;

  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('authToken') || '';

  // Build backend URL
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  const [doctorName, setDoctorName] = useState<string>(initialDoctorName || '');
  const [fee, setFee] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // On mount: validate presence of doctorId & slotDatetime
  useEffect(() => {
    if (!doctorId || !slotDatetime) {
      setError('Missing booking information. Please book again.');
      setLoading(false);
      return;
    }
    // Fetch doctor details (fee, name) from backend
    (async () => {
      setLoading(true);
      try {
        const resDoc = await axios.get(buildUrl(`/medical/doctors/${doctorId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const d = resDoc.data;
        setDoctorName(initialDoctorName || d.name || '');
        const fetchedFee = typeof d.consultationFee === 'number' ? d.consultationFee : 0;
        setFee(fetchedFee);
        setCurrency('INR');
        setError(null);
      } catch (e: any) {
        console.error('Error fetching doctor info:', e);
        // If backend returns an error message, show it; otherwise generic
        const msg = e.response?.data?.message || 'Failed to load doctor info.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId, slotDatetime, initialDoctorName, token]);

  // Handle payment process
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !slotDatetime) {
      setError('Missing booking info.');
      return;
    }
    if (!isAuthenticated) {
      setError('Please log in to proceed.');
      return;
    }
    setPaymentLoading(true);
    try {
      // 1. Create Razorpay order on backend
      const { data: order } = await axios.post(
        buildUrl('/payments/create-order'),
        {
          doctorId,
          datetime: slotDatetime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Expect: { orderId, razorpayKey, amount, currency }
      const { orderId, razorpayKey, amount, currency: respCurrency } = order;

      // 2. Load Razorpay script
      const ok = await loadRazorpayScript();
      if (!ok) {
        setToast({ type: 'error', message: 'Unable to load payment SDK.' });
        setPaymentLoading(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: amount, // in paise
        currency: respCurrency,
        name: 'MedicoX',
        description: `Consultation with Dr. ${doctorName}`,
        order_id: orderId,
        handler: async (resp: any) => {
          try {
            // 4. Confirm payment & create appointment on backend
            const resConfirm = await axios.post(
              buildUrl('/appointments/confirm-after-payment'),
              {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                doctorId,
                datetime: slotDatetime,
                // optionally pass message: state.message
                message: state?.message || '',
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const { appointmentId: newApptId } = resConfirm.data;
            setAppointmentId(newApptId);
            setPaymentSuccess(true);
            setToast({ type: 'success', message: 'Payment successful! Appointment confirmed.' });
          } catch (vErr) {
            console.error('Confirm & create appointment error:', vErr);
            const msg = vErr.response?.data?.message || 'Failed to confirm appointment.';
            setToast({ type: 'error', message: msg });
          }
        },
        prefill: { name: user?.name || '' },
        theme: { color: '#3399cc' },
      };
      const rz = new (window as any).Razorpay(options);
      rz.on('payment.failed', (f: any) => {
        console.error('Payment failed', f.error);
        setToast({ type: 'error', message: f.error.description || 'Payment failed' });
      });
      rz.open();
    } catch (e: any) {
      console.error('Payment start error', e);
      const msg = e.response?.data?.message || 'Payment failed to start.';
      setToast({ type: 'error', message: msg });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Generate PDF receipt after success
  const handleDownload = () => {
    if (!appointmentId) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18).text('Invoice / Receipt', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.text(`Appointment ID: ${appointmentId}`, 20, y);
    y += 8;
    const dtStr = new Date(slotDatetime || '').toLocaleString();
    doc.text(`Date & Time: ${dtStr}`, 20, y);
    y += 8;
    doc.text(`Patient: ${user?.name || ''}`, 20, y);
    y += 8;
    doc.text(`Doctor: Dr. ${doctorName}`, 20, y);
    y += 12;
    doc.text(`Consultation Fee: ₹${fee.toFixed(2)}`, 30, y);
    y += 12;
    doc.setFontSize(14).text(`Total: ₹${fee.toFixed(2)}`, 20, y);
    y += 12;
    doc.setFontSize(10).text('Thank you for your payment!', 20, y);
    y += 8;
    doc.text('Generated by MedicoX', 20, y);
    doc.save(`Invoice_${appointmentId}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading booking info…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <ThreeBackground />

      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 to-indigo-100/80 py-8">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            {paymentSuccess ? 'Appointment Confirmed' : 'Confirm & Pay'}
          </h2>

          {!paymentSuccess && (
            <>
              <div className="space-y-2 mb-6 text-gray-700">
                <p><strong>Doctor:</strong> Dr. {doctorName}</p>
                <p><strong>Date & Time:</strong> {new Date(slotDatetime || '').toLocaleString()}</p>
                <p><strong>Amount:</strong> ₹{fee.toFixed(2)}</p>
              </div>

              <form onSubmit={handlePayment}>
                <p className="mb-4 text-gray-700">
                  Proceed to pay ₹{fee.toFixed(2)}
                </p>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {paymentLoading ? 'Processing…' : 'Pay Now'}
                </button>
              </form>
            </>
          )}

          {paymentSuccess && appointmentId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Payment Successful!
              </h3>
              <p className="mb-2">Your appointment has been booked.</p>
              <p className="mb-4">
                Appointment ID: <span className="font-medium">{appointmentId}</span>
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Download Receipt
              </button>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default PaymentPage;

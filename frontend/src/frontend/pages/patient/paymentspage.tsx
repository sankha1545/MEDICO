// File: frontend/src/pages/PaymentPage.tsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import ThreeBackground from '../../components/payments/ThreeBackground';
import Toast from '../../components/payments/Toast';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeftCircle, Loader2 } from 'lucide-react';
import logo from '../../assets/Logo.png';

interface LocationState {
  doctorId?: string;
  datetime?: string;
  doctorName?: string;
  message?: string;
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: 30, transition: { duration: 0.4 } },
};
const buttonVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };
const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const doctorId = state?.doctorId;
  const slotDatetime = state?.datetime;
  const initialDoctorName = state?.doctorName;
  const extraMessage = state?.message || '';

  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('authToken') || '';

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  const [doctorName, setDoctorName] = useState(initialDoctorName || '');
  const [consultationFee, setConsultationFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [currency] = useState('INR');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!doctorId || !slotDatetime) {
      setError('Missing booking info. Please start booking again.');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const resDoc = await axios.get(buildUrl(`/medical/doctors/${doctorId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const d = resDoc.data;
        const fetchedName = initialDoctorName || d.name || '';
        setDoctorName(fetchedName);
        const fee = typeof d.consultationFee === 'number' ? d.consultationFee : 0;
        setConsultationFee(fee);
        setTotalFee(fee);
      } catch (e: any) {
        console.error('Error fetching doctor info:', e);
        const msg = e.response?.data?.message || 'Failed to load doctor info.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId, slotDatetime, initialDoctorName, token]);

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
    setError(null);

    try {
      const { data: order } = await axios.post(
        buildUrl('/payments/create-order'),
        { doctorId, datetime: slotDatetime, message: extraMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Order response:', order);
      if (
        !order ||
        !order.orderId ||
        !order.keyId ||
        typeof order.amount !== 'number' ||
        !order.appointmentId
      ) {
        throw new Error('Invalid order response');
      }
      const { appointmentId: apptId, orderId, amount, currency: respCurrency, keyId } = order;
      setAppointmentId(apptId);

      const ok = await loadRazorpayScript();
      if (!ok) {
        setToast({ type: 'error', message: 'Unable to load Razorpay SDK.' });
        setPaymentLoading(false);
        return;
      }

      const options: any = {
        key: keyId,
        amount: amount,
        currency: respCurrency,
        name: 'MedicoX',
        description: `Consultation with Dr. ${doctorName}`,
        order_id: orderId,
        handler: async (resp: any) => {
          try {
            const resConfirm = await axios.post(
              buildUrl('/appointments/confirm-after-payment'),
              {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                appointmentId: apptId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Appointment confirmed:', resConfirm.data);
            setBookingDate(new Date().toLocaleString());
            setPaymentSuccess(true);
            setToast({ type: 'success', message: 'Payment successful! Appointment confirmed.' });
          } catch (confirmErr: any) {
            console.error('Error confirming appointment:', confirmErr);
            const msg =
              confirmErr.response?.data?.message ||
              'Failed to confirm appointment after payment.';
            setToast({ type: 'error', message: msg });
          }
        },
        prefill: {
          name: user?.name || '',
          email: (user as any)?.email || '',
          contact: (user as any)?.phone || '',
        },
        theme: { color: '#4f46e5' },
      };
      const rz = new (window as any).Razorpay(options);
      rz.on('payment.failed', (f: any) => {
        console.error('Payment failed', f.error);
        setToast({ type: 'error', message: f.error.description || 'Payment failed' });
      });
      rz.open();
    } catch (err: any) {
      console.error('Payment start error:', err);
      if (err.response) {
        const srvMsg = err.response.data?.message || 'Failed to start payment.';
        setToast({ type: 'error', message: `Server Error: ${srvMsg}` });
      } else {
        setToast({ type: 'error', message: 'Network error, please try again later.' });
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownload = async () => {
    if (!appointmentId) return;
    const doc = new jsPDF({ unit: 'pt', format: 'A4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;
    try {
      const logoData = await getBase64FromUrl(logo);
      if (logoData) {
        doc.addImage(logoData, 'PNG', 40, y, 80, 40);
      }
    } catch (e) {
      console.warn('Skipping logo:', e);
    }
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const title = 'INVOICE';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, pageWidth - 100, y + 20);
    y += 70;

    doc.setFontSize(10);
    doc.text(`Booking Date: ${bookingDate}`, 50, y);
    doc.text(`Appointment Date: ${new Date(slotDatetime || '').toLocaleString()}`, 50, y + 15);
    doc.text(`Appointment ID: ${appointmentId}`, pageWidth - 200, y);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 200, y + 15);
    y += 50;

    doc.text(`Billed To: ${user?.name}`, 50, y);
    doc.text((user as any)?.email || '', 50, y + 15);
    doc.text((user as any)?.phone || '', 50, y + 30);
    doc.text('From: MedicoX', pageWidth - 200, y);
    y += 60;

    doc.setFont('helvetica', 'bold');
    doc.text('Description', 50, y);
    doc.text('Amount (INR)', pageWidth - 120, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.text(`Consultation with Dr. ${doctorName}`, 50, y);
    doc.text(`₹${consultationFee.toFixed(2)}`, pageWidth - 120, y);
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.text('Total', 50, y);
    doc.text(`₹${totalFee.toFixed(2)}`, pageWidth - 120, y);
    y += 40;

    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing MedicoX!', 50, y);
    doc.save(`MedicoX_Invoice_${appointmentId}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p className="text-red-600 mb-4">{error}</p>
        <motion.button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <ArrowLeftCircle size={20} /> <span>Go Back</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <>
      <ThreeBackground />

      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50/80 to-indigo-100/80 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            className="text-2xl font-extrabold mb-6 text-center text-indigo-700"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {paymentSuccess ? 'Appointment Confirmed' : 'Confirm & Pay'}
          </motion.h2>

          {!paymentSuccess && (
            <>
              <motion.div
                className="space-y-3 mb-6 text-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p>
                  <span className="font-medium">Doctor:</span> Dr. {doctorName}
                </p>
                <p>
                  <span className="font-medium">Appointment Date & Time:</span>{' '}
                  {new Date(slotDatetime || '').toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Consultation Fee:</span> ₹{consultationFee.toFixed(2)}
                </p>
                <p className="text-lg">
                  <span className="font-semibold">Total:</span> ₹{totalFee.toFixed(2)}
                </p>
              </motion.div>

              <motion.form
                onSubmit={handlePayment}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="mb-4 text-gray-700">
                  Please proceed to pay ₹{totalFee.toFixed(2)}
                </p>
                <motion.button
                  type="submit"
                  disabled={paymentLoading}
                  className="w-full flex justify-center items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {paymentLoading && <Loader2 className="animate-spin mr-2" size={20} />}
                  <span>{paymentLoading ? 'Processing…' : 'Pay Now'}</span>
                </motion.button>
              </motion.form>
            </>
          )}

          {paymentSuccess && appointmentId && (
            <motion.div
              className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="text-green-600" size={24} />
                <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
              </div>
              <p className="mb-2">Your appointment has been booked.</p>
              <p className="mb-4">
                Appointment ID: <span className="font-medium">{appointmentId}</span>
              </p>
              <motion.button
                onClick={handleDownload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Download Receipt
              </motion.button>
            </motion.div>
          )}

          <motion.button
            onClick={() => navigate(-1)}
            className="mt-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ArrowLeftCircle size={20} /> <span>Back</span>
          </motion.button>
        </motion.div>
      </motion.div>

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

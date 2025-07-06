// File: frontend/src/pages/PaymentPage.tsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import ThreeBackground from '../../components/payments/ThreeBackground';
import Toast from '../../components/payments/Toast';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeftCircle, Loader2, Download } from 'lucide-react';
import logo from '../../assets/Logo.png';

interface LocationState {
  doctorId?: string;
  datetime?: string;
  doctorName?: string;
  message?: string;
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      return resolve(true);
    }
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
  const { state } = useLocation<LocationState>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('authToken') || '';

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  const [doctorName, setDoctorName] = useState(state?.doctorName || '');
  const [consultationFee, setConsultationFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!state?.doctorId || !state.datetime) {
      setError('Missing booking info. Please restart booking.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(buildUrl(`/medical/doctors/${state.doctorId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setDoctorName(state.doctorName || res.data.name);
        const fee = res.data.consultationFee || 0;
        setConsultationFee(fee);
        setTotalFee(fee);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load doctor info.');
      } finally {
        setLoading(false);
      }
    })();
  }, [state, token]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in to proceed.');
      return;
    }
    setPaymentLoading(true);
    setError(null);

    try {
      const { data: order } = await axios.post(
        buildUrl('/payments/create-order'),
        {
          doctorId: state!.doctorId,
          datetime: state!.datetime,
          message: state?.message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error('Razorpay SDK failed to load.');

      setAppointmentId(order.appointmentId);
      const options: any = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'MedicoX',
        description: `Consultation with Dr. ${doctorName}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name,
          email: (user as any)?.email,
          contact: (user as any)?.phone,
        },
        theme: { color: '#7C3AED' },
        handler: async (resp: any) => {
          try {
            await axios.post(
              buildUrl('/appointments/confirm-after-payment'),
              {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                appointmentId: order.appointmentId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setBookingDate(new Date().toLocaleString());
            setPaymentSuccess(true);
            setToast({ type: 'success', message: 'Payment successful! 🎉' });
          } catch (err: any) {
            setToast({
              type: 'error',
              message: err.response?.data?.message || 'Confirmation failed.',
            });
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      };

      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || err.response?.data?.message || 'Payment initialization failed.',
      });
      setPaymentLoading(false);
    }
  };

  // Helper to load logo as base64
  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // ─── MODERN INVOICE DESIGN ─────────────────────────────────────────────────────

const downloadInvoice = async () => {
  if (!appointmentId) return;

  const doc = new jsPDF({ unit: 'pt', format: 'A4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 30;

  // HEADER BAR
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor('#FFF');
  doc.text('MEDICOX INVOICE', 40, 40);

  // LOGO TOP-RIGHT
  const logo64 = await getBase64FromUrl(logo);
  if (logo64) {
    doc.addImage(logo64, 'PNG', pageWidth - 120, 10, 80, 40);
  }

  // INFO BOXES
  y = 80;
  const boxWidth = (pageWidth - 100) / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#333');
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(40, y, boxWidth, 50, 5, 5, 'F');
  doc.roundedRect(60 + boxWidth, y, boxWidth, 50, 5, 5, 'F');

  doc.setTextColor('#555');
  doc.text(`Invoice #: ${appointmentId}`, 50, y + 15);
  doc.text(`Date: ${bookingDate}`, 50, y + 30);
  doc.text('Appointment:', 60 + boxWidth, y + 15);
  doc.text(new Date(state!.datetime).toLocaleString(), 60 + boxWidth, y + 30);

  // BILL TO / FROM
  y += 80; // jump past info boxes
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#333');
  doc.text('BILLED TO:', 40, y);
  doc.text('FROM:', pageWidth / 2 + 20, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 15;
  doc.text(user?.name || '', 40, y);
  doc.text((user as any)?.email || '', 40, y + 12);
  doc.text((user as any)?.phone || '', 40, y + 24);

  doc.text('MedicoX Healthcare Pvt. Ltd.', pageWidth / 2 + 20, y);
  doc.text('123 Wellness Drive', pageWidth / 2 + 20, y + 12);
  doc.text('support@medicox.com', pageWidth / 2 + 20, y + 24);

  // TABLE HEADER
  y += 60; // move past billed-to section
  const headerHeight = 20;
  doc.setFillColor(79, 70, 229);
  doc.setTextColor('#FFF');
  doc.rect(40, y, pageWidth - 80, headerHeight, 'F');

  doc.setFontSize(11);
  doc.text('Description', 45, y + 14);
  doc.text('Amount (Rs) ', pageWidth - 120, y + 16);

  // TABLE ROWS
  const rowHeight = 20;
  y += headerHeight + 5; // add 5px padding before rows

  // Row 1 background
  doc.setFillColor(250, 250, 250);
  doc.rect(40, y - 5, pageWidth - 80, rowHeight, 'F');
  doc.setTextColor('#333');
  doc.setFont('helvetica', 'normal');
  doc.text(`Consultation with Dr. ${doctorName}`, 45, y + 10);
  doc.text(`Rs ${consultationFee.toFixed(2)}`, pageWidth - 120, y + 10);

  // TOTAL ROW
  y += rowHeight + 10; // 10px between rows
  doc.setFillColor(245, 245, 245);
  doc.rect(40, y - 5, pageWidth - 80, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#333');
  doc.text('TOTAL', 45, y + 10);
  doc.text(`Rs ${totalFee.toFixed(2)}`, pageWidth - 120, y + 10);

  // FOOTER NOTE
  y += rowHeight + 30;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor('#777');
  doc.text(
    'Thank you for using  MedicoX for your healthcare needs!',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  doc.save(`MedicoX_Invoice_${appointmentId}.pdf`);
};


  // ───────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <Loader2 className="text-purple-600 animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
        <p className="mb-4 text-red-700">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          <ArrowLeftCircle size={20} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <ThreeBackground />
      <div className="min-h-screen py-8 bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-2xl mx-auto">
          {!paymentSuccess ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="p-8 bg-white shadow-lg rounded-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold text-center text-purple-700">
                Confirm & Pay
              </h2>
              <div className="mb-6 space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold">Doctor:</span> Dr. {doctorName}
                </p>
                <p>
                  <span className="font-semibold">Appointment:</span>{' '}
                  {new Date(state!.datetime).toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold">Fee:</span> ₹{consultationFee.toFixed(2)}
                </p>
                <p className="text-lg">
                  <span className="font-semibold">Total:</span> ₹{totalFee.toFixed(2)}
                </p>
              </div>
              <form onSubmit={handlePayment}>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex items-center justify-center w-full py-3 space-x-2 font-medium text-white rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <span>Pay ₹{totalFee.toFixed(2)}</span>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-8 bg-white border-t-4 border-purple-600 shadow-xl rounded-2xl"
            >
              <div className="flex items-center mb-6 space-x-3">
                <CheckCircle2 className="text-green-500" size={28} />
                <h2 className="text-2xl font-bold text-green-700">
                  Payment Successful!
                </h2>
              </div>
              <div className="p-6 mb-6 rounded-lg bg-gray-50">
                <h3 className="mb-4 text-xl font-semibold text-purple-700">
                  Your Invoice
                </h3>
                <div className="space-y-2 text-gray-800">
                  <p>
                    <span className="font-medium">Invoice #:</span> {appointmentId}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {bookingDate}
                  </p>
                </div>
                <table className="w-full mt-4 text-gray-800">
                  <thead className="text-white bg-purple-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Amount Rs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2">Consultation with Dr. {doctorName}</td>
                      <td className="px-4 py-2 text-right">{consultationFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold">Total</td>
                      <td className="px-4 py-2 font-semibold text-right">
                        {totalFee.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={downloadInvoice}
                  className="flex items-center justify-center flex-1 py-3 space-x-2 text-white rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Download size={20} />
                  <span>Download Invoice</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
};

export default PaymentPage;

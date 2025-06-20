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
import logo from '../../assets/Logo.png'; // Adjust path if necessary

// The shape of location.state when navigating to PaymentPage
interface LocationState {
  doctorId?: string;
  datetime?: string;   // ISO string for appointment slot
  doctorName?: string; // optional if already known
  message?: string;    // optional extra message
}

// Dynamically load Razorpay checkout script
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

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: 30, transition: { duration: 0.4 } },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const doctorId = state?.doctorId;
  const slotDatetime = state?.datetime; // ISO string for appointment slot
  const initialDoctorName = state?.doctorName;

  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('authToken') || '';

  // Helper to build backend URLs, avoiding double '/api'
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  // State for doctor info and fees
  const [doctorName, setDoctorName] = useState<string>(initialDoctorName || '');
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [totalFee, setTotalFee] = useState<number>(0); // equals consultationFee since no platform fee
  const [currency, setCurrency] = useState<string>('INR');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(''); // formatted booking date

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // On mount: validate presence of doctorId & slotDatetime, fetch doctor info
  useEffect(() => {
    if (!doctorId || !slotDatetime) {
      setError('Missing booking information. Please book again.');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        // Fetch doctor details including consultationFee
        const resDoc = await axios.get(buildUrl(`/medical/doctors/${doctorId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const d = resDoc.data;
        const fetchedDoctorName = initialDoctorName || d.name || '';
        setDoctorName(fetchedDoctorName);

        const fetchedFee = typeof d.consultationFee === 'number' ? d.consultationFee : 0;
        setConsultationFee(fetchedFee);

        // Total fee equals consultationFee (no platform fee)
        setTotalFee(fetchedFee);

        setCurrency('INR');
        setError(null);
      } catch (e: any) {
        console.error('Error fetching doctor info:', e);
        const msg = e.response?.data?.message || 'Failed to load doctor info.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId, slotDatetime, initialDoctorName, token]);

  // Handle payment: create Razorpay order with totalFee, open checkout, then confirm & create appointment
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
      //    Send total amount in paise: e.g., ₹1000.50 => 100050 paise
      const amountInPaise = Math.round(totalFee * 100);
      const { data: order } = await axios.post(
        buildUrl('/payments/create-order'),
        {
          doctorId,
          datetime: slotDatetime,
          amount: amountInPaise,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Backend should return: { orderId, razorpayKey, amount, currency }
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
            // 4. On successful payment, confirm & create appointment on backend
            const now = new Date();
            const bookingDateISO = now.toISOString();
            const resConfirm = await axios.post(
              buildUrl('/appointments/confirm-after-payment'),
              {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                doctorId,
                datetime: slotDatetime,
                message: state?.message || '',
                consultationFee,
                totalFee,
                bookingDate: bookingDateISO,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            // Backend returns: { appointmentId: string }
            const { appointmentId: newApptId } = resConfirm.data;
            setAppointmentId(newApptId);
            // Save formatted booking date to show in PDF
            setBookingDate(new Date().toLocaleString());
            setPaymentSuccess(true);
            setToast({ type: 'success', message: 'Payment successful! Appointment confirmed.' });
          } catch (vErr) {
            console.error('Confirm & create appointment error:', vErr);
            const msg = vErr.response?.data?.message || 'Failed to confirm appointment.';
            setToast({ type: 'error', message: msg });
          }
        },
        prefill: {
          name: user?.name || '',
          email: (user as any)?.email || '',
          contact: (user as any)?.phone || '',
        },
        theme: { color: '#4f46e5' }, // Indigo-600
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

  // Helper to fetch an image URL and convert to Base64 data URL for jsPDF
  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Logo fetch returned non-OK:', res.status);
        return null;
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) {
        console.warn('Fetched resource is not an image:', blob.type);
        return null;
      }
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (typeof result === 'string' && result.startsWith('data:image/')) {
            resolve(result);
          } else {
            console.warn('Result is not a valid data URL:', result);
            resolve(null);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Error fetching logo for PDF:', err);
      return null;
    }
  };

  // Generate PDF receipt after payment success
  const handleDownload = async () => {
    if (!appointmentId) return;
    const doc = new jsPDF({ unit: 'pt', format: 'A4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    // 1. Logo and "INVOICE" header
    try {
      const logoUrl = logo;
      const logoData = await getBase64FromUrl(logoUrl);
      if (logoData) {
        const imgProps = doc.getImageProperties(logoData);
        const imgWidth = 80;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(logoData, 'PNG', margin, y, imgWidth, imgHeight);
      }
    } catch (imgErr) {
      console.warn('Skipping logo due to error:', imgErr);
    }
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const title = 'INVOICE';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, pageWidth - margin - titleWidth, y + 20);
    y += 60;

    // 2. Invoice metadata box (light background)
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, 80, 'F');
    doc.setFontSize(10);
    doc.setTextColor(80);

    // Booking Date & Appointment Date on left
    const bookingDateText = bookingDate || new Date().toLocaleString();
    doc.text(`Booking Date: ${bookingDateText}`, margin + 10, y + 20);
    const apptDateStr = new Date(slotDatetime || '').toLocaleString();
    doc.text(`Appointment Date: ${apptDateStr}`, margin + 10, y + 36);

    // Invoice # and generation date on right
    doc.setFont('helvetica', 'bold');
    const invLabel = `Appointment Id: ${appointmentId}`;
    const invLabelWidth = doc.getTextWidth(invLabel);
    doc.text(invLabel, pageWidth - margin - invLabelWidth - 10, y + 20);
    doc.setFont('helvetica', 'normal');
    const genDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const genLabel = `Date: ${genDate}`;
    const genLabelWidth = doc.getTextWidth(genLabel);
    doc.text(genLabel, pageWidth - margin - genLabelWidth - 10, y + 36);
    y += 100;

    // 3. Billed To / From section
    const sectionHeight = 90;
    const halfWidth = (pageWidth - 2 * margin) / 2 - 10;

    // "Billed To"
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, halfWidth, sectionHeight, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Billed To:', margin + 8, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const patientName = user?.name || '';
    const patientEmail = (user as any)?.email || '';
    const patientPhone = (user as any)?.phone || '';
    doc.text(patientName, margin + 8, y + 34);
    doc.text(patientEmail, margin + 8, y + 50);
    doc.text(patientPhone, margin + 8, y + 66);

    // "Billed From"
    doc.setFillColor(245, 245, 245);
    doc.rect(margin + halfWidth + 20, y, halfWidth, sectionHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Billed From:', margin + halfWidth + 28, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('MedicoX', margin + halfWidth + 28, y + 34);
    doc.text('support@medicox.com', margin + halfWidth + 28, y + 50);
    doc.text('www.medicox.com', margin + halfWidth + 28, y + 66);
    y += sectionHeight + 20;

    // 4. Services table header
    const tableX = margin;
    const tableY = y;
    const tableWidth = pageWidth - 2 * margin;
    const rowHeight = 25;
    // Header background
    doc.setFillColor(230, 230, 230);
    doc.rect(tableX, tableY, tableWidth, rowHeight, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text('Description', tableX + 10, tableY + 17);
    const amountLabel = 'Amount (INR)';
    const amountLabelWidth = doc.getTextWidth(amountLabel);
    doc.text(amountLabel, pageWidth - margin - amountLabelWidth - 10, tableY + 17);

    // 5. Service row: Consultation Fee only
    y = tableY + rowHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50);
    const desc1 = `Consultation with Dr. ${doctorName}`;
    const feeStr = `₹${consultationFee.toFixed(2)}`;
    doc.text(desc1, tableX + 10, y + 17);
    const feeWidth = doc.getTextWidth(feeStr);
    doc.text(feeStr, pageWidth - margin - feeWidth - 10, y + 17);
    y += rowHeight;

    // 6. Total row emphasized
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(tableX, y, tableWidth, rowHeight, 'F');
    const totalLabelText = 'Total';
    const totalStr = `₹${totalFee.toFixed(2)}`;
    doc.text(totalLabelText, tableX + 10, y + 17);
    const totalWidthText = doc.getTextWidth(totalStr);
    doc.text(totalStr, pageWidth - margin - totalWidthText - 10, y + 17);
    y += rowHeight + 20;

    // 7. Footer / Thank you note
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(
      'Thank you for choosing MedicoX for your healthcare needs!',
      margin,
      y
    );
    y += 14;
    doc.text(
      'If you have any questions, contact us at support@medicox.com',
      margin,
      y
    );

    // Save PDF
    doc.save(`MedicoX_Invoice_${appointmentId}.pdf`);
  };

  // Render loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  // Render error screen
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

  // Main UI
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
                  {paymentLoading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : null}
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

// File: frontend/components/common/SettingsPage.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  Bell,
  Lock,
  Trash2,
  Download,
  Video,
  MessageCircle,
  BarChart,
  Database,
  Users,
} from 'lucide-react';
import { Button } from './Button';
import { SlideIn } from '../animations/Transitions';
import { useAuth } from '../../../contexts/AuthContext';

interface SettingsPageProps {
  onBack: () => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { deleteAccount } = useAuth();

  // 1. Availability & Schedule
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [breakTime, setBreakTime] = useState({ start: '', end: '' });
  const [appointmentDuration, setAppointmentDuration] = useState('30');
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  // 2. Appointment Settings
  const [modes, setModes] = useState({ inPerson: true, video: true, phone: true });
  const [gapBetween, setGapBetween] = useState('10');
  const [maxPerDay, setMaxPerDay] = useState('20');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [bufferBefore, setBufferBefore] = useState('5');
  const [bufferAfter, setBufferAfter] = useState('5');

  // 3. Payment & Fees
  const [fees, setFees] = useState({ inPerson: '500', video: '400', phone: '300' });
  const [packageOffer, setPackageOffer] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [paymentHistory] = useState([
    { date: '2025-05-01', amount: '₹2,000', mode: 'UPI' },
    { date: '2025-04-15', amount: '₹1,500', mode: 'Card' },
  ]);

  // 4. Notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [reminderTimes, setReminderTimes] = useState({ dayBefore: true, hourBefore: true });
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(false);

  // 5. Security Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);

  // 6. Telemedicine & Video Call Setup
  const [videoProvider, setVideoProvider] = useState('Zoom');
  const [testCall, setTestCall] = useState(false);

  // 7. Communication Settings
  const [autoResponse, setAutoResponse] = useState('I am currently with a patient.');
  const [chatAvailable, setChatAvailable] = useState(true);

  // 8. Analytics Preferences
  const [enableAnalytics, setEnableAnalytics] = useState(false);
  const [reportEmails, setReportEmails] = useState({ daily: false, weekly: false });

  // 9. Document Management
  const [certificates, setCertificates] = useState<string[]>([]);
  const [newCertificate, setNewCertificate] = useState<File | null>(null);

  // 10. EHR / EMR Integration
  const [ehrKey, setEhrKey] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('daily');

  // 11. Account Management: enhanced delete flow for doctor
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deactivated, setDeactivated] = useState(false);

  // Delete flow states:
  //  - deleteStage: 'none' | 'confirm' | 'password' | 'locked'
  const [deleteStage, setDeleteStage] = useState<'none' | 'confirm' | 'password' | 'locked'>('none');
  const [passwordInput, setPasswordInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addException = () => {
    if (newExceptionDate && !exceptions.includes(newExceptionDate)) {
      setExceptions((prev) => [...prev, newExceptionDate]);
      setNewExceptionDate('');
    }
  };

  const removeException = (date: string) => {
    setExceptions((prev) => prev.filter((d) => d !== date));
  };

  const uploadCertificate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCertificates((prev) => [...prev, file.name]);
      setNewCertificate(file);
    }
  };

  // Handle deactivate account (doctor)
  const handleDeactivate = async () => {
    try {
      await fetch('/api/user/deactivate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      setDeactivated(true);
      setDeactivateConfirm(false);
    } catch (err) {
      console.error('Deactivate error', err);
      alert('Failed to deactivate account.');
    }
  };

  // Start delete flow: first confirm
  const initiateDelete = () => {
    setDeleteError(null);
    setPasswordInput('');
    setDeleteStage('confirm');
  };

  // After user confirms “Yes, delete”, move to password prompt
  const confirmDeleteYes = () => {
    setDeleteStage('password');
    setDeleteError(null);
    setPasswordInput('');
  };

  // Cancel delete at any stage
  const cancelDelete = () => {
    setDeleteStage('none');
    setDeleteError(null);
    setPasswordInput('');
  };

  // Submit password for deletion
  const submitDeletePassword = async () => {
    setDeleteError(null);
    try {
      await deleteAccount(passwordInput);
      // On success, deleteAccount navigates away
    } catch (err: any) {
      const msg = err.message || 'Delete failed';
      // If backend indicates lockout
      if (msg.toLowerCase().includes('disabled for')) {
        setDeleteStage('locked');
        setDeleteError(msg);
      } else {
        // Incorrect password with attempts remaining
        setDeleteError(msg);
        // Stay in 'password' stage for retry
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Back button */}
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-1 border-gray-600 text-gray-200 hover:border-gray-500 hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-extrabold text-gray-100 flex items-center">
            <CalendarIcon className="mr-2 w-6 h-6 text-primary-500" />
            Settings
          </h1>
        </motion.div>

        {/* 1. Availability & Schedule */}
        <SlideIn direction="up" delay={0.1}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <CalendarIcon className="mr-2 w-5 h-5 text-primary-500" />
              Availability & Schedule
            </h2>

            {/* Weekly Schedule */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Weekly Schedule:</p>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-lg border ${
                      availableDays.includes(day)
                        ? 'bg-primary-500 text-white'
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Break Time */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Break Time:</p>
              <input
                type="time"
                value={breakTime.start}
                onChange={(e) => setBreakTime((prev) => ({ ...prev, start: e.target.value }))}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-300">to</span>
              <input
                type="time"
                value={breakTime.end}
                onChange={(e) => setBreakTime((prev) => ({ ...prev, end: e.target.value }))}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Appointment Duration */}
            <div className="flex items-center space-x-4">
              <p className="text-gray-400 font-medium">Duration (min):</p>
              <select
                value={appointmentDuration}
                onChange={(e) => setAppointmentDuration(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </div>

            {/* Date Exceptions */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Date Exceptions:</p>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                  className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button variant="primary" size="sm" onClick={addException}>
                  Add
                </Button>
              </div>
              <ul className="mt-2 space-y-1">
                {exceptions.map((date) => (
                  <li
                    key={date}
                    className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"
                  >
                    <span className="text-gray-100">{date}</span>
                    <button onClick={() => removeException(date)}>
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency Closure Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400 font-medium">Emergency Closure:</p>
              <button
                onClick={() => setIsClosed(!isClosed)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isClosed ? 'bg-red-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Emergency Closure"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isClosed ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </SlideIn>

        {/* 2. Appointment Settings */}
        <SlideIn direction="up" delay={0.2}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Clock className="mr-2 w-5 h-5 text-primary-500" />
              Appointment Settings
            </h2>

            {/* Consultation Modes */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Consultation Modes:</p>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={modes.inPerson}
                    onChange={() =>
                      setModes((prev) => ({ ...prev, inPerson: !prev.inPerson }))
                    }
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">In-person</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={modes.video}
                    onChange={() => setModes((prev) => ({ ...prev, video: !prev.video }))}
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">Video</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={modes.phone}
                    onChange={() => setModes((prev) => ({ ...prev, phone: !prev.phone }))}
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">Phone</span>
                </label>
              </div>
            </div>

            {/* Gap Between */}
            <div className="flex items-center space-x-4">
              <p className="text-gray-400 font-medium">Gap Between (min):</p>
              <input
                type="number"
                min="0"
                value={gapBetween}
                onChange={(e) => setGapBetween(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-20 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Max per Day */}
            <div className="flex items-center space-x-4">
              <p className="text-gray-400 font-medium">Max/Day:</p>
              <input
                type="number"
                min="1"
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-20 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Auto-confirm */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Auto-confirm:</span>
              <button
                onClick={() => setAutoConfirm(!autoConfirm)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoConfirm ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Auto-confirm"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoConfirm ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Buffer Time */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Buffer Time (min):</p>
              <input
                type="number"
                min="0"
                value={bufferBefore}
                onChange={(e) => setBufferBefore(e.target.value)}
                placeholder="Before"
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                min="0"
                value={bufferAfter}
                onChange={(e) => setBufferAfter(e.target.value)}
                placeholder="After"
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </section>
        </SlideIn>

        {/* 3. Payment & Fees */}
        <SlideIn direction="up" delay={0.3}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <CreditCard className="mr-2 w-5 h-5 text-primary-500" />
              Payment & Fees
            </h2>

            {/* Consultation Fees */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Consultation Fees:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-gray-300">In-person:</label>
                  <input
                    type="number"
                    value={fees.inPerson}
                    onChange={(e) =>
                      setFees((prev) => ({ ...prev, inPerson: e.target.value }))
                    }
                    className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-300">Video:</label>
                  <input
                    type="number"
                    value={fees.video}
                    onChange={(e) =>
                      setFees((prev) => ({ ...prev, video: e.target.value }))
                    }
                    className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-300">Phone:</label>
                  <input
                    type="number"
                    value={fees.phone}
                    onChange={(e) =>
                      setFees((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Discount / Packages */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Discount / Packages:</p>
              <input
                type="text"
                placeholder="e.g., 10% off 5 sessions"
                value={packageOffer}
                onChange={(e) => setPackageOffer(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="primary" size="sm">
                Save Offer
              </Button>
            </div>

            {/* Bank / UPI */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Bank / UPI:</p>
              <input
                type="text"
                placeholder="Account Number / UPI ID"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="primary" size="sm">
                Verify
              </Button>
            </div>

            {/* Payment History */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Payment History:</p>
              <div className="bg-gray-700 rounded-lg overflow-auto">
                <table className="min-w-full text-left text-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((txn, idx) => (
                      <tr key={idx} className="border-t border-gray-600">
                        <td className="px-4 py-2">{txn.date}</td>
                        <td className="px-4 py-2">{txn.amount}</td>
                        <td className="px-4 py-2">{txn.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </SlideIn>

        {/* 4. Notifications */}
        <SlideIn direction="up" delay={0.4}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Bell className="mr-2 w-5 h-5 text-primary-500" />
              Notifications
            </h2>

            {/* Email & SMS */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Email & SMS:</p>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={() => setEmailNotif(!emailNotif)}
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">Email</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={() => setSmsNotif(!smsNotif)}
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">SMS</span>
                </label>
              </div>
            </div>

            {/* Appointment Reminders */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Appointment Reminders:</p>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={reminderTimes.dayBefore}
                    onChange={() =>
                      setReminderTimes((prev) => ({ ...prev, dayBefore: !prev.dayBefore }))
                    }
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">24h before</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={reminderTimes.hourBefore}
                    onChange={() =>
                      setReminderTimes((prev) => ({ ...prev, hourBefore: !prev.hourBefore }))
                    }
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">1h before</span>
                </label>
              </div>
            </div>

            {/* Patient Messages */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span>Patient Messages</span>
              </span>
              <button
                onClick={() => setNotifyMessages(!notifyMessages)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  notifyMessages ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Patient Messages Notifications"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notifyMessages ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* System Alerts */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Bell className="w-5 h-5 text-gray-400" />
                <span>System Alerts</span>
              </span>
              <button
                onClick={() => setSystemAlerts(!systemAlerts)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  systemAlerts ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle System Alerts"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    systemAlerts ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Bell className="w-5 h-5 text-gray-400" />
                <span>Push Notifications</span>
              </span>
              <button
                onClick={() => setPushNotif(!pushNotif)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  pushNotif ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Push Notifications"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    pushNotif ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Sound/Popup Alerts */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Bell className="w-5 h-5 text-gray-400" />
                <span>Sound/Popup Alerts</span>
              </span>
              <button
                onClick={() => setSoundAlerts(!soundAlerts)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  soundAlerts ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Sound/Popup Alerts"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    soundAlerts ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </SlideIn>

        {/* 5. Security Settings */}
        <SlideIn direction="up" delay={0.5}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Lock className="mr-2 w-5 h-5 text-primary-500" />
              Security Settings
            </h2>

            {/* Change Password */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Change Password:</p>
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="primary" size="sm">
                Update
              </Button>
            </div>

            {/* Enable 2FA */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Lock className="w-5 h-5 text-gray-400" />
                <span>Enable Two-Factor Auth</span>
              </span>
              <button
                onClick={() => setEnable2FA(!enable2FA)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  enable2FA ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle 2FA"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    enable2FA ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </SlideIn>

        {/* 6. Video Call Setup */}
        <SlideIn direction="up" delay={0.6}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Video className="mr-2 w-5 h-5 text-primary-500" />
              Video Call Setup
            </h2>

            {/* Connect Provider */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Provider:</p>
              <select
                value={videoProvider}
                onChange={(e) => setVideoProvider(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Zoom">Zoom</option>
                <option value="Google Meet">Google Meet</option>
                <option value="Jitsi">Jitsi</option>
              </select>
              <Button variant="primary" size="sm" onClick={() => setTestCall(true)}>
                Test
              </Button>
            </div>
            {testCall && <p className="text-green-400">Setup success!</p>}
          </section>
        </SlideIn>

        {/* 7. Communication Settings */}
        <SlideIn direction="up" delay={0.7}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <MessageCircle className="mr-2 w-5 h-5 text-primary-500" />
              Communication Settings
            </h2>

            {/* Auto-response */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">Auto-response:</p>
              <input
                type="text"
                value={autoResponse}
                onChange={(e) => setAutoResponse(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-2/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Chat Availability */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Users className="w-5 h-5 text-gray-400" />
                <span>Chat Availability</span>
              </span>
              <button
                onClick={() => setChatAvailable(!chatAvailable)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  chatAvailable ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Chat Availability"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    chatAvailable ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </SlideIn>

        {/* 8. Analytics Preferences */}
        <SlideIn direction="up" delay={0.8}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <BarChart className="mr-2 w-5 h-5 text-primary-500" />
              Analytics Preferences
            </h2>

            {/* Enable Analytics */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Database className="w-5 h-5 text-gray-400" />
                <span>Enable Analytics</span>
              </span>
              <button
                onClick={() => setEnableAnalytics(!enableAnalytics)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  enableAnalytics ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Analytics"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    enableAnalytics ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Report Emails */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Report Emails:</p>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={reportEmails.daily}
                    onChange={() =>
                      setReportEmails((prev) => ({ ...prev, daily: !prev.daily }))
                    }
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">Daily</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={reportEmails.weekly}
                    onChange={() =>
                      setReportEmails((prev) => ({ ...prev, weekly: !prev.weekly }))
                    }
                    className="h-4 w-4 text-primary-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-200">Weekly</span>
                </label>
              </div>
            </div>
          </section>
        </SlideIn>

        {/* 9. Document Management */}
        <SlideIn direction="up" delay={0.9}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Download className="mr-2 w-5 h-5 text-primary-500" />
              Document Management
            </h2>

            {/* Certificates & Licenses */}
            <div className="space-y-2">
              <p className="text-gray-400 font-medium">Certificates & Licenses:</p>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={uploadCertificate}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <ul className="mt-2 space-y-1">
                {certificates.map((cert, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"
                  >
                    <span className="text-gray-100">{cert}</span>
                    <button onClick={() => setCertificates((prev) => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Medical Record Access */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium flex items-center space-x-1">
                <Database className="w-5 h-5 text-gray-400" />
                <span>Medical Record Access</span>
              </span>
              <Button variant="primary" size="sm">
                Manage
              </Button>
            </div>
          </section>
        </SlideIn>

        {/* 10. EHR / EMR Integration */}
        <SlideIn direction="up" delay={1.0}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Users className="mr-2 w-5 h-5 text-primary-500" />
              EHR / EMR Integration
            </h2>

            {/* EHR API Key */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <p className="text-gray-400 font-medium">EHR API Key:</p>
              <input
                type="text"
                value={ehrKey}
                onChange={(e) => setEhrKey(e.target.value)}
                placeholder="Enter API Key"
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="primary" size="sm">
                Connect
              </Button>
            </div>

            {/* Sync Frequency */}
            <div className="flex items-center space-x-4">
              <p className="text-gray-400 font-medium">Sync Frequency:</p>
              <select
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="real-time">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </section>
        </SlideIn>

        {/* 11. Account Management */}
        <SlideIn direction="up" delay={1.1}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Users className="mr-2 w-5 h-5 text-primary-500" />
              Account Management
            </h2>

            {/* Deactivate Account */}
            {!deactivated ? (
              <>
                {!deactivateConfirm ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeactivateConfirm(true)}
                    className="border-red-600 hover:border-red-500"
                  >
                    Deactivate Account
                  </Button>
                ) : (
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-200">Are you sure you want to deactivate?</span>
                    <Button variant="outline" size="sm" onClick={() => setDeactivateConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeactivate}>
                      Yes, Deactivate
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-yellow-400">Account deactivated.</p>
            )}

            {/* Delete Account */}
            {deleteStage === 'none' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={initiateDelete}
                className="border-red-600 hover:border-red-500"
              >
                Delete Account
              </Button>
            )}

            {deleteStage === 'confirm' && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-200">
                  Permanent delete? This will remove your doctor account and all associated data.
                </span>
                <Button variant="outline" size="sm" onClick={cancelDelete}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={confirmDeleteYes}>
                  Yes, Delete
                </Button>
              </div>
            )}

            {deleteStage === 'password' && (
              <div className="flex flex-col space-y-2">
                <p className="text-gray-200">Enter your password to confirm deletion:</p>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Password"
                />
                {deleteError && <p className="text-red-400">{deleteError}</p>}
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" onClick={cancelDelete}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={submitDeletePassword}>
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}

            {deleteStage === 'locked' && (
              <div className="flex flex-col space-y-2">
                <p className="text-red-400">
                  {deleteError ||
                    'Delete disabled due to multiple failed attempts. Please try again later.'}
                </p>
              </div>
            )}
          </section>
        </SlideIn>
      </div>
    </div>
  );
};

export default SettingsPage;

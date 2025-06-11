// File: src/frontend/components/common/PatientSettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CreditCard,
  Bell,
  Lock,
  Link2,
  LogOut,
  Trash2,
} from 'lucide-react';
import { Button } from './Button';
import { SlideIn } from '../animations/Transitions';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

interface PatientSettingsPageProps {
  onBack: () => void;
}

const PatientSettingsPage: React.FC<PatientSettingsPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { deleteAccount, logout } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL;

  // ─── 1. Health Records & History ───
  const [uploadedReport, setUploadedReport] = useState<File | null>(null);
  const [insuranceInfo, setInsuranceInfo] = useState('');
  const [insuranceSaved, setInsuranceSaved] = useState(false);

  const handleUploadReport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedReport(e.target.files[0]);
      // TODO: implement actual upload API call
    }
  };
  const saveInsurance = () => {
    if (insuranceInfo.trim()) {
      // TODO: API call to save insurance info
      setInsuranceSaved(true);
    }
  };

  // ─── 2. Payment & Billing ───
  const [billingInsurance, setBillingInsurance] = useState('');
  const [billingSaved, setBillingSaved] = useState(false);
  const saveBillingInsurance = () => {
    if (billingInsurance.trim()) {
      // TODO: API call to save billing insurance
      setBillingSaved(true);
    }
  };

  // ─── 3. Notification Settings ───
  const [emailApptNotif, setEmailApptNotif] = useState(true);
  const [emailDoctorMsg, setEmailDoctorMsg] = useState(true);
  const [emailPromo, setEmailPromo] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCarrierDomain, setSmsCarrierDomain] = useState('');
  const [inAppNotif, setInAppNotif] = useState(true);

  // Carrier options for email-to-SMS gateways; adjust as needed
  const carrierOptions = [
    { label: 'Select carrier', value: '' },
    { label: 'AT&T', value: 'txt.att.net' },
    { label: 'Verizon', value: 'vtext.com' },
    { label: 'T-Mobile', value: 'tmomail.net' },
    { label: 'Sprint', value: 'messaging.sprintpcs.com' },
    // Add more carriers or allow custom input
  ];

  // Fetch existing notification preferences on mount
  useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await axios.get(`${apiBase}/notifications/preferences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        const prefs = res.data.notificationSettings || {};
        setEmailApptNotif(Boolean(prefs.emailAppointments));
        setEmailDoctorMsg(Boolean(prefs.emailDoctorMessages));
        setEmailPromo(Boolean(prefs.emailPromotions));
        setSmsAlerts(Boolean(prefs.smsAlerts));
        setSmsPhone(prefs.smsPhone || '');
        setSmsCarrierDomain(prefs.smsCarrierDomain || '');
        setInAppNotif(Boolean(prefs.inAppNotifications));
      } catch (e) {
        console.error('Failed to load notification preferences', e);
      }
    }
    fetchPrefs();
  }, [apiBase]);

  // Helper to update notification settings in backend
  const updateNotificationSettings = async (updatedFields: Partial<{
    emailAppointments: boolean;
    emailDoctorMessages: boolean;
    emailPromotions: boolean;
    smsAlerts: boolean;
    smsPhone: string;
    smsCarrierDomain: string;
    inAppNotifications: boolean;
  }>) => {
    // Build full body merging current states and updatedFields
    const body = {
      emailAppointments: emailApptNotif,
      emailDoctorMessages: emailDoctorMsg,
      emailPromotions: emailPromo,
      smsAlerts,
      smsPhone,
      smsCarrierDomain,
      inAppNotifications: inAppNotif,
      ...updatedFields,
    };
    // If smsAlerts is true, ensure phone & carrierDomain present
    if (body.smsAlerts) {
      if (!body.smsPhone.trim() || !body.smsCarrierDomain.trim()) {
        // Do not send incomplete; skip update or alert user
        console.warn('SMS Alerts enabled but phone or carrier domain missing');
        // Optionally show a UI warning
      }
    }
    try {
      const res = await axios.put(
        `${apiBase}/notifications/preferences`,
        body,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Optionally handle returned prefs: res.data.notificationSettings
    } catch (e) {
      console.error('Failed to update notification prefs', e);
    }
  };

  // Handlers for toggles
  const toggleEmailAppt = () => {
    const newVal = !emailApptNotif;
    setEmailApptNotif(newVal);
    updateNotificationSettings({ emailAppointments: newVal });
  };
  const toggleEmailDoctorMsg = () => {
    const newVal = !emailDoctorMsg;
    setEmailDoctorMsg(newVal);
    updateNotificationSettings({ emailDoctorMessages: newVal });
  };
  const toggleEmailPromo = () => {
    const newVal = !emailPromo;
    setEmailPromo(newVal);
    updateNotificationSettings({ emailPromotions: newVal });
  };
  const toggleSmsAlerts = () => {
    const newVal = !smsAlerts;
    setSmsAlerts(newVal);
    updateNotificationSettings({ smsAlerts: newVal });
  };
  const handleSmsPhoneBlur = () => {
    updateNotificationSettings({ smsPhone: smsPhone.trim() });
  };
  const handleSmsCarrierChange = (val: string) => {
    setSmsCarrierDomain(val);
    updateNotificationSettings({ smsCarrierDomain: val });
  };
  const toggleInAppNotif = () => {
    const newVal = !inAppNotif;
    setInAppNotif(newVal);
    updateNotificationSettings({ inAppNotifications: newVal });
  };

  // ─── 4. Privacy & Consent ───
  const [dataSharing, setDataSharing] = useState(true);
  const [doctorAccessRevoked, setDoctorAccessRevoked] = useState(false);
  const [treatmentConsent, setTreatmentConsent] = useState(true);

  // ─── 5. Connected Services ───
  const [wearableLinked, setWearableLinked] = useState(false);
  const [emergencyNumbers, setEmergencyNumbers] = useState<string[]>([]);
  const [newEmergency, setNewEmergency] = useState('');
  const addEmergencyContact = () => {
    const trimmed = newEmergency.trim();
    if (trimmed && !emergencyNumbers.includes(trimmed)) {
      setEmergencyNumbers(prev => [...prev, trimmed]);
      setNewEmergency('');
      // TODO: API call to save emergency contact
    }
  };
  const removeEmergencyContact = (num: string) => {
    setEmergencyNumbers(prev => prev.filter(n => n !== num));
    // TODO: API call to remove emergency contact
  };

  // ─── 6. Session & Access ───
  const [sessionMessage, setSessionMessage] = useState('');
  const logoutOtherDevices = () => {
    // TODO: API call to logout other sessions
    setSessionMessage('Logged out from other devices.');
  };
  const clearActivityLogs = () => {
    // TODO: API call to clear logs
    setSessionMessage('Activity logs cleared.');
  };

  // ─── 7. Danger Zone ───
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [recordsDeleted, setRecordsDeleted] = useState(false);

  // Deactivate flow
  const [deactivateStage, setDeactivateStage] = useState<'none' | 'confirm'>('none');
  const handleDeactivateConfirm = () => setDeactivateStage('confirm');
  const cancelDeactivate = () => setDeactivateStage('none');
  const performDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account?')) {
      setDeactivateStage('none');
      return;
    }
    try {
      await fetch(`${apiBase}/user/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setAccountDeactivated(true);
      localStorage.removeItem('authToken');
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Error deactivating account:', err);
      alert('Failed to deactivate account.');
    }
  };

  // Delete medical records only
  const handleDeleteRecords = () => {
    if (
      window.confirm(
        'Are you sure you want to delete all your medical records? This cannot be undone.'
      )
    ) {
      // TODO: API call to delete only medical records
      setRecordsDeleted(true);
    }
  };

  // Enhanced delete account flow
  const [deleteStage, setDeleteStage] = useState<'none' | 'confirm' | 'password' | 'locked'>('none');
  const [passwordInput, setPasswordInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const initiateDelete = () => {
    setDeleteError(null);
    setPasswordInput('');
    setDeleteStage('confirm');
  };
  const cancelDelete = () => {
    setDeleteStage('none');
    setDeleteError(null);
    setPasswordInput('');
  };
  const confirmDeleteYes = () => {
    setDeleteStage('password');
    setDeleteError(null);
    setPasswordInput('');
  };
  const submitDeletePassword = async () => {
    setDeleteError(null);
    try {
      await deleteAccount(passwordInput);
      // On success, deleteAccount navigates to signup
    } catch (err: any) {
      const msg: string = err.message || 'Delete failed';
      if (msg.toLowerCase().includes('disabled for')) {
        setDeleteStage('locked');
        setDeleteError(msg);
      } else {
        setDeleteError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button + Title */}
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

        {/* ─── 1. Health Records & History ─── */}
        <SlideIn direction="up" delay={0.1}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <CalendarIcon className="mr-2 w-5 h-5 text-primary-500" />
              Health Records & History
            </h2>
            {/* View Past Appointments */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">View Past Appointments</span>
              <Button size="sm" onClick={() => navigate('/appointments/history')}>
                View
              </Button>
            </div>
            {/* Download Prescriptions */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Download Prescriptions</span>
              <Button size="sm" onClick={() => {/* TODO */}}>
                Download
              </Button>
            </div>
            {/* Upload Medical Reports */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <span className="text-gray-200">Upload Medical Report</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleUploadReport}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {uploadedReport && (
                <span className="text-green-400">{uploadedReport.name} selected</span>
              )}
            </div>
            {/* Insurance Information */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <span className="text-gray-200">Insurance Information</span>
              <input
                type="text"
                placeholder="Provider / Policy #"
                value={insuranceInfo}
                onChange={e => setInsuranceInfo(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button size="sm" onClick={saveInsurance}>
                Save
              </Button>
              {insuranceSaved && <span className="text-green-400">Insurance saved</span>}
            </div>
          </section>
        </SlideIn>

        {/* ─── 2. Payment & Billing ─── */}
        <SlideIn direction="up" delay={0.2}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <CreditCard className="mr-2 w-5 h-5 text-primary-500" />
              Payment & Billing
            </h2>
            {/* Saved Payment Methods */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Saved Payment Methods</span>
              <Button size="sm" onClick={() => navigate('/billing/methods')}>
                Manage
              </Button>
            </div>
            {/* Billing History */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Billing History</span>
              <Button size="sm" onClick={() => navigate('/billing/history')}>
                View
              </Button>
            </div>
            {/* Download Invoices/Receipts */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Download Invoices/Receipts</span>
              <Button size="sm" onClick={() => {/* TODO */}}>
                Download
              </Button>
            </div>
            {/* Add Insurance Details */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
              <span className="text-gray-200">Add Insurance Details</span>
              <input
                type="text"
                placeholder="Provider / Policy #"
                value={billingInsurance}
                onChange={e => setBillingInsurance(e.target.value)}
                className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button size="sm" onClick={saveBillingInsurance}>
                Add
              </Button>
              {billingSaved && <span className="text-green-400">Details added</span>}
            </div>
          </section>
        </SlideIn>

        {/* ─── 3. Notification Settings ─── */}
        <SlideIn direction="up" delay={0.3}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Bell className="mr-2 w-5 h-5 text-primary-500" />
              Notification Settings
            </h2>

            {/* Email: Appointments */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Email: Appointments</span>
              <button
                onClick={toggleEmailAppt}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailApptNotif ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Email Appointments"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    emailApptNotif ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Email: New Doctor Messages */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Email: New Doctor Messages</span>
              <button
                onClick={toggleEmailDoctorMsg}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailDoctorMsg ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Email Doctor Messages"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    emailDoctorMsg ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Email: Promotions */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Email: Promotions</span>
              <button
                onClick={toggleEmailPromo}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailPromo ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Email Promotions"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    emailPromo ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* SMS Alerts */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-200">SMS Alerts</span>
                <button
                  onClick={toggleSmsAlerts}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    smsAlerts ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                  aria-label="Toggle SMS Alerts"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      smsAlerts ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
              {smsAlerts && (
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2">
                  <input
                    type="text"
                    placeholder="Phone for SMS (digits only)"
                    value={smsPhone}
                    onChange={e => setSmsPhone(e.target.value.replace(/\D/g, ''))}
                    onBlur={handleSmsPhoneBlur}
                    className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <select
                    value={smsCarrierDomain}
                    onChange={e => handleSmsCarrierChange(e.target.value)}
                    className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {carrierOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* In-app Notifications */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">In-app Notifications</span>
              <button
                onClick={toggleInAppNotif}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  inAppNotif ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle In-app Notifications"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    inAppNotif ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </SlideIn>

        {/* ─── 4. Privacy & Consent ─── */}
        <SlideIn direction="up" delay={0.4}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Lock className="mr-2 w-5 h-5 text-primary-500" />
              Privacy & Consent
            </h2>

            {/* Data Sharing Preferences */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Data Sharing Preferences</span>
              <button
                onClick={() => setDataSharing(prev => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  dataSharing ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    dataSharing ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Revoke Doctor Access */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Revoke Doctor Access to Records</span>
              <button
                onClick={() => setDoctorAccessRevoked(prev => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  doctorAccessRevoked ? 'bg-red-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    doctorAccessRevoked ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Consent for Treatment/Telemedicine */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Consent for Treatment/Telemedicine</span>
              <button
                onClick={() => setTreatmentConsent(prev => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  treatmentConsent ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    treatmentConsent ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </SlideIn>

        {/* ─── 5. Connected Services ─── */}
        <SlideIn direction="up" delay={0.5}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Link2 className="mr-2 w-5 h-5 text-primary-500" />
              Connected Services
            </h2>

            {/* Link Wearables/Health Apps */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Link Wearables/Health Apps</span>
              <button
                onClick={() => setWearableLinked(prev => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  wearableLinked ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    wearableLinked ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-2">
              <p className="text-gray-200 font-medium">Emergency Contacts:</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newEmergency}
                  onChange={e => setNewEmergency(e.target.value)}
                  className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button size="sm" onClick={addEmergencyContact}>
                  Add
                </Button>
              </div>
              <ul className="mt-2 space-y-1">
                {emergencyNumbers.map((num, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"
                  >
                    <span className="text-gray-100">{num}</span>
                    <button onClick={() => removeEmergencyContact(num)}>
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </SlideIn>

        {/* ─── 6. Session & Access ─── */}
        <SlideIn direction="up" delay={0.6}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <LogOut className="mr-2 w-5 h-5 text-primary-500" />
              Session & Access
            </h2>

            {/* Logout of Other Devices */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Logout of Other Devices</span>
              <Button size="sm" onClick={logoutOtherDevices}>
                Logout
              </Button>
            </div>

            {/* Manage Active Sessions */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Manage Active Sessions</span>
              <Button size="sm" onClick={() => {/* TODO */}}>
                Manage
              </Button>
            </div>

            {/* Account Activity Logs */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Account Activity Logs</span>
              <Button size="sm" onClick={clearActivityLogs}>
                Clear Logs
              </Button>
            </div>

            {sessionMessage && <p className="text-green-400 mt-2">{sessionMessage}</p>}
          </section>
        </SlideIn>

        {/* ─── 7. Danger Zone ─── */}
        <SlideIn direction="up" delay={0.7}>
          <section className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6 border border-red-600">
            <h2 className="text-xl font-semibold text-red-500 flex items-center">
              <Trash2 className="mr-2 w-5 h-5" />
              Danger Zone
            </h2>

            {/* Deactivate Account */}
            <div className="flex justify-between items-center">
              <span className="text-red-400">Deactivate Account</span>
              {deactivateStage === 'none' ? (
                <Button variant="destructive" size="sm" onClick={handleDeactivateConfirm}>
                  Deactivate
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-200">Confirm deactivation?</span>
                  <Button variant="outline" size="sm" onClick={cancelDeactivate}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={performDeactivate}>
                    Yes, Deactivate
                  </Button>
                </div>
              )}
            </div>
            {accountDeactivated && <p className="text-red-400 text-sm">Account deactivated.</p>}

            {/* Delete Medical Records */}
            <div className="flex justify-between items-center">
              <span className="text-red-400">Delete Medical Records</span>
              <Button variant="destructive" size="sm" onClick={handleDeleteRecords}>
                Delete
              </Button>
            </div>
            {recordsDeleted && <p className="text-red-400 text-sm">Records deleted.</p>}

            {/* Permanently Delete Account */}
            <div className="flex flex-col space-y-2">
              {deleteStage === 'none' && (
                <div className="flex justify-between items-center">
                  <span className="text-red-400">Permanently Delete Account</span>
                  <Button variant="destructive" size="sm" onClick={initiateDelete}>
                    Delete
                  </Button>
                </div>
              )}

              {deleteStage === 'confirm' && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-200">
                    This will erase your account and all data. Continue?
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
                  <p className="text-gray-200">Enter password to confirm deletion:</p>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Password"
                  />
                  {deleteError && <p className="text-red-400">{deleteError}</p>}
                  <div className="flex items-center space-x-2">
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
                <p className="text-red-400">
                  {deleteError ||
                    'Delete disabled due to multiple failed attempts. Please try again later.'}
                </p>
              )}
            </div>
          </section>
        </SlideIn>
      </div>
    </div>
  );
};

export default PatientSettingsPage;

// File: src/frontend/components/common/PatientSettingsPage.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Download,
  UploadCloud,
  Shield,
  CreditCard,
  Bell,
  Lock,
  Link2,
  LogOut,
  Trash2,
} from 'lucide-react';
import axios from 'axios';
import { Button } from './Button';
import { SlideIn } from '../animations/Transitions';
import { useNavigate } from 'react-router-dom';

interface PatientSettingsPageProps {
  onBack: () => void;
}

const PatientSettingsPage: React.FC<PatientSettingsPageProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // ─── 1. Health Records & History ───
  const [uploadedReport, setUploadedReport] = useState<File | null>(null);
  const [insuranceInfo, setInsuranceInfo] = useState('');
  const [insuranceSaved, setInsuranceSaved] = useState(false);

  const handleUploadReport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedReport(e.target.files[0]);
    }
  };

  const saveInsurance = () => {
    if (insuranceInfo.trim()) {
      setInsuranceSaved(true);
    }
  };

  // ─── 2. Payment & Billing ───
  const [billingInsurance, setBillingInsurance] = useState('');
  const [billingSaved, setBillingSaved] = useState(false);

  const saveBillingInsurance = () => {
    if (billingInsurance.trim()) {
      setBillingSaved(true);
    }
  };

  // ─── 3. Notification Settings ───
  const [emailApptNotif, setEmailApptNotif] = useState(true);
  const [emailDoctorMsg, setEmailDoctorMsg] = useState(true);
  const [emailPromo, setEmailPromo] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);

  // ─── 4. Privacy & Consent ───
  const [dataSharing, setDataSharing] = useState(true);
  const [doctorAccessRevoked, setDoctorAccessRevoked] = useState(false);
  const [treatmentConsent, setTreatmentConsent] = useState(true);

  // ─── 5. Connected Services ───
  const [wearableLinked, setWearableLinked] = useState(false);
  const [emergencyNumbers, setEmergencyNumbers] = useState<string[]>([]);
  const [newEmergency, setNewEmergency] = useState('');

  const addEmergencyContact = () => {
    if (newEmergency.trim() && !emergencyNumbers.includes(newEmergency.trim())) {
      setEmergencyNumbers(prev => [...prev, newEmergency.trim()]);
      setNewEmergency('');
    }
  };

  const removeEmergencyContact = (num: string) => {
    setEmergencyNumbers(prev => prev.filter(n => n !== num));
  };

  // ─── 6. Session & Access ───
  const [sessionMessage, setSessionMessage] = useState('');

  const logoutOtherDevices = () => setSessionMessage('Logged out from other devices.');
  const clearActivityLogs = () => setSessionMessage('Activity logs cleared.');

  // ─── 7. Danger Zone ───
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [recordsDeleted, setRecordsDeleted] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

  // ─── API Interaction ───
  const authToken = localStorage.getItem('authToken') || '';

  const deactivateAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account?')) {
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/user/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setAccountDeactivated(true);
      // After deactivation, log the user out completely
      localStorage.removeItem('authToken');
      navigate('/login');
    } catch (err) {
      console.error('Error deactivating account:', err);
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account as all your data will be erased completely?'
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/user`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setAccountDeleted(true);
      // Show a modal or alert, then redirect to signup
      alert('Your account has been successfully deleted.');
      localStorage.removeItem('authToken');
      navigate('/signup');
    } catch (err) {
      console.error('Error deleting account:', err);
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
              <Button size="sm">View</Button>
            </div>

            {/* Download Prescriptions */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Download Prescriptions</span>
              <Button size="sm">Download</Button>
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
                <span className="text-green-400">{uploadedReport.name} uploaded</span>
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
              <Button size="sm">Manage</Button>
            </div>

            {/* Billing History */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Billing History</span>
              <Button size="sm">View</Button>
            </div>

            {/* Download Invoices/Receipts */}
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Download Invoices/Receipts</span>
              <Button size="sm">Download</Button>
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
                onClick={() => setEmailApptNotif(!emailApptNotif)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailApptNotif ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    emailApptNotif ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Email: Doctor Messages */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">Email: New Doctor Messages</span>
              <button
                onClick={() => setEmailDoctorMsg(!emailDoctorMsg)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailDoctorMsg ? 'bg-green-500' : 'bg-gray-600'
                }`}
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
                onClick={() => setEmailPromo(!emailPromo)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailPromo ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    emailPromo ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* SMS Alerts */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">SMS Alerts</span>
              <button
                onClick={() => setSmsAlerts(!smsAlerts)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  smsAlerts ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    smsAlerts ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* In-app Notifications */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200">In-app Notifications</span>
              <button
                onClick={() => setInAppNotif(!inAppNotif)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  inAppNotif ? 'bg-green-500' : 'bg-gray-600'
                }`}
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
                onClick={() => setDataSharing(!dataSharing)}
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
                onClick={() => setDoctorAccessRevoked(!doctorAccessRevoked)}
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
                onClick={() => setTreatmentConsent(!treatmentConsent)}
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
                onClick={() => setWearableLinked(!wearableLinked)}
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
              <Button size="sm">Manage</Button>
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
              <Button variant="destructive" size="sm" onClick={deactivateAccount}>
                Deactivate
              </Button>
            </div>
            {accountDeactivated && <p className="text-red-400 text-sm">Account deactivated.</p>}

            {/* Delete Medical Records */}
            <div className="flex justify-between items-center">
              <span className="text-red-400">Delete Medical Records</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete all your medical records? This cannot be undone.'
                    )
                  ) {
                    setRecordsDeleted(true);
                    // Here you could call an endpoint to delete only medical records if desired
                  }
                }}
              >
                Delete
              </Button>
            </div>
            {recordsDeleted && (
              <p className="text-red-400 text-sm">Records deleted.</p>
            )}

            {/* Permanently Delete Account */}
            <div className="flex justify-between items-center">
              <span className="text-red-400">Permanently Delete Account</span>
              <Button variant="destructive" size="sm" onClick={deleteAccount}>
                Delete
              </Button>
            </div>
            {accountDeleted && (
              <p className="text-red-400 text-sm">Account permanently deleted.</p>
            )}
          </section>
        </SlideIn>
      </div>
    </div>
  );
};

export default PatientSettingsPage;

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
import Background3D from '../animations/3D/Background3D';
import AnimatedCard from '../animations/3D/AnimatedCard';
import AnimatedToggle from '../animations/3D/Animatedtoggle';
import AnimatedInput from '../animations/3D/Animatedinput';
import AnimatedButton from '../common/AnimatedButton';

interface PatientSettingsProps {
  onBack: () => void;
}

const PatientSettings: React.FC<PatientSettingsProps> = ({ onBack }) => {
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
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCarrierDomain, setSmsCarrierDomain] = useState('');
  const [inAppNotif, setInAppNotif] = useState(true);

  const carrierOptions = [
    { label: 'Select carrier', value: '' },
    { label: 'AT&T', value: 'txt.att.net' },
    { label: 'Verizon', value: 'vtext.com' },
    { label: 'T-Mobile', value: 'tmomail.net' },
    { label: 'Sprint', value: 'messaging.sprintpcs.com' },
  ];

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
    }
  };

  const removeEmergencyContact = (num: string) => {
    setEmergencyNumbers(prev => prev.filter(n => n !== num));
  };

  // ─── 6. Session & Access ───
  const [sessionMessage, setSessionMessage] = useState('');

  const logoutOtherDevices = () => {
    setSessionMessage('Logged out from other devices.');
  };

  const clearActivityLogs = () => {
    setSessionMessage('Activity logs cleared.');
  };

  // ─── 7. Danger Zone ───
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [recordsDeleted, setRecordsDeleted] = useState(false);
  const [deactivateStage, setDeactivateStage] = useState<'none' | 'confirm'>('none');
  const [deleteStage, setDeleteStage] = useState<'none' | 'confirm' | 'password' | 'locked'>('none');
  const [passwordInput, setPasswordInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeactivateConfirm = () => setDeactivateStage('confirm');
  const cancelDeactivate = () => setDeactivateStage('none');

  const performDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account?')) {
      setDeactivateStage('none');
      return;
    }
    setAccountDeactivated(true);
  };

  const handleDeleteRecords = () => {
    if (window.confirm('Are you sure you want to delete all your medical records? This cannot be undone.')) {
      setRecordsDeleted(true);
    }
  };

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
    // Simulate delete logic
    if (passwordInput === 'correct') {
      // Success
    } else {
      setDeleteError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Background3D />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </AnimatedButton>
            <h1 className="text-4xl font-extrabold text-white flex items-center">
              <CalendarIcon className="mr-3 w-8 h-8 text-cyan-400" />
              Patient Settings
            </h1>
          </motion.div>

          {/* Health Records & History */}
          <AnimatedCard delay={1}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <CalendarIcon className="mr-3 w-6 h-6 text-cyan-400" />
              Health Records & History
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/90">View Past Appointments</span>
                  <AnimatedButton size="sm">View</AnimatedButton>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Download Prescriptions</span>
                  <AnimatedButton size="sm">Download</AnimatedButton>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 mb-2">Upload Medical Report</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleUploadReport}
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:text-gray-900 file:font-semibold hover:file:bg-cyan-300"
                  />
                  {uploadedReport && (
                    <span className="text-emerald-400 text-sm mt-2 block">{uploadedReport.name} selected</span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <AnimatedInput
                    placeholder="Insurance Provider / Policy #"
                    value={insuranceInfo}
                    onChange={setInsuranceInfo}
                    className="flex-1"
                  />
                  <AnimatedButton size="sm" onClick={saveInsurance}>
                    Save
                  </AnimatedButton>
                </div>
                {insuranceSaved && <span className="text-emerald-400 text-sm">Insurance saved</span>}
              </div>
            </div>
          </AnimatedCard>

          {/* Payment & Billing */}
          <AnimatedCard delay={2}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <CreditCard className="mr-3 w-6 h-6 text-cyan-400" />
              Payment & Billing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Saved Payment Methods</span>
                  <AnimatedButton size="sm">Manage</AnimatedButton>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Billing History</span>
                  <AnimatedButton size="sm">View</AnimatedButton>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/90">Download Invoices/Receipts</span>
                  <AnimatedButton size="sm">Download</AnimatedButton>
                </div>
              </div>
              
              <div>
                <div className="flex space-x-2">
                  <AnimatedInput
                    placeholder="Insurance Provider / Policy #"
                    value={billingInsurance}
                    onChange={setBillingInsurance}
                    className="flex-1"
                  />
                  <AnimatedButton size="sm" onClick={saveBillingInsurance}>
                    Add
                  </AnimatedButton>
                </div>
                {billingSaved && <span className="text-emerald-400 text-sm mt-2 block">Details added</span>}
              </div>
            </div>
          </AnimatedCard>

          {/* Notification Settings */}
          <AnimatedCard delay={3}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Bell className="mr-3 w-6 h-6 text-cyan-400" />
              Notification Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <AnimatedToggle
                  checked={emailApptNotif}
                  onChange={() => setEmailApptNotif(!emailApptNotif)}
                  label="Email: Appointments"
                />
                
                <AnimatedToggle
                  checked={emailDoctorMsg}
                  onChange={() => setEmailDoctorMsg(!emailDoctorMsg)}
                  label="Email: Doctor Messages"
                />
                
                <AnimatedToggle
                  checked={emailPromo}
                  onChange={() => setEmailPromo(!emailPromo)}
                  label="Email: Promotions"
                />
              </div>
              
              <div className="space-y-4">
                <AnimatedToggle
                  checked={smsAlerts}
                  onChange={() => setSmsAlerts(!smsAlerts)}
                  label="SMS Alerts"
                />
                
                {smsAlerts && (
                  <div className="space-y-3 pl-4 border-l-2 border-cyan-400/30">
                    <AnimatedInput
                      placeholder="Phone for SMS (digits only)"
                      value={smsPhone}
                      onChange={(value) => setSmsPhone(value.replace(/\D/g, ''))}
                    />
                    <select
                      value={smsCarrierDomain}
                      onChange={(e) => setSmsCarrierDomain(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    >
                      {carrierOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-gray-800">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <AnimatedToggle
                  checked={inAppNotif}
                  onChange={() => setInAppNotif(!inAppNotif)}
                  label="In-app Notifications"
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Privacy & Consent */}
          <AnimatedCard delay={4}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Lock className="mr-3 w-6 h-6 text-cyan-400" />
              Privacy & Consent
            </h2>
            
            <div className="space-y-4">
              <AnimatedToggle
                checked={dataSharing}
                onChange={() => setDataSharing(!dataSharing)}
                label="Data Sharing Preferences"
              />
              
              <AnimatedToggle
                checked={doctorAccessRevoked}
                onChange={() => setDoctorAccessRevoked(!doctorAccessRevoked)}
                label="Revoke Doctor Access to Records"
              />
              
              <AnimatedToggle
                checked={treatmentConsent}
                onChange={() => setTreatmentConsent(!treatmentConsent)}
                label="Consent for Treatment/Telemedicine"
              />
            </div>
          </AnimatedCard>

          {/* Connected Services */}
          <AnimatedCard delay={5}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Link2 className="mr-3 w-6 h-6 text-cyan-400" />
              Connected Services
            </h2>
            
            <div className="space-y-6">
              <AnimatedToggle
                checked={wearableLinked}
                onChange={() => setWearableLinked(!wearableLinked)}
                label="Link Wearables/Health Apps"
              />
              
              <div>
                <p className="text-white/90 font-medium mb-3">Emergency Contacts:</p>
                <div className="flex space-x-2 mb-3">
                  <AnimatedInput
                    placeholder="Phone Number"
                    value={newEmergency}
                    onChange={setNewEmergency}
                    className="flex-1"
                  />
                  <AnimatedButton size="sm" onClick={addEmergencyContact}>
                    Add
                  </AnimatedButton>
                </div>
                <div className="space-y-2">
                  {emergencyNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10"
                    >
                      <span className="text-white">{num}</span>
                      <button 
                        onClick={() => removeEmergencyContact(num)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Session & Access */}
          <AnimatedCard delay={6}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <LogOut className="mr-3 w-6 h-6 text-cyan-400" />
              Session & Access
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-white/90">Logout Other Devices</span>
                <AnimatedButton size="sm" onClick={logoutOtherDevices}>
                  Logout
                </AnimatedButton>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/90">Manage Sessions</span>
                <AnimatedButton size="sm">Manage</AnimatedButton>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/90">Clear Activity Logs</span>
                <AnimatedButton size="sm" onClick={clearActivityLogs}>
                  Clear
                </AnimatedButton>
              </div>
            </div>
            
            {sessionMessage && (
              <p className="text-emerald-400 mt-4 text-center">{sessionMessage}</p>
            )}
          </AnimatedCard>

          {/* Danger Zone */}
          <AnimatedCard delay={7} className="border-red-500/30 bg-red-900/10">
            <h2 className="text-2xl font-bold text-red-400 flex items-center mb-6">
              <Trash2 className="mr-3 w-6 h-6" />
              Danger Zone
            </h2>
            
            <div className="space-y-6">
              {/* Deactivate Account */}
              <div className="flex justify-between items-center">
                <span className="text-red-300">Deactivate Account</span>
                {deactivateStage === 'none' ? (
                  <AnimatedButton variant="destructive" size="sm" onClick={handleDeactivateConfirm}>
                    Deactivate
                  </AnimatedButton>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-white/90">Confirm deactivation?</span>
                    <AnimatedButton variant="secondary" size="sm" onClick={cancelDeactivate}>
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton variant="destructive" size="sm" onClick={performDeactivate}>
                      Yes, Deactivate
                    </AnimatedButton>
                  </div>
                )}
              </div>
              {accountDeactivated && <p className="text-red-400 text-sm">Account deactivated.</p>}

              {/* Delete Medical Records */}
              <div className="flex justify-between items-center">
                <span className="text-red-300">Delete Medical Records</span>
                <AnimatedButton variant="destructive" size="sm" onClick={handleDeleteRecords}>
                  Delete
                </AnimatedButton>
              </div>
              {recordsDeleted && <p className="text-red-400 text-sm">Records deleted.</p>}

              {/* Permanently Delete Account */}
              <div className="space-y-3">
                {deleteStage === 'none' && (
                  <div className="flex justify-between items-center">
                    <span className="text-red-300">Permanently Delete Account</span>
                    <AnimatedButton variant="destructive" size="sm" onClick={initiateDelete}>
                      Delete
                    </AnimatedButton>
                  </div>
                )}

                {deleteStage === 'confirm' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-white/90">
                      This will erase your account and all data. Continue?
                    </span>
                    <AnimatedButton variant="secondary" size="sm" onClick={cancelDelete}>
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton variant="destructive" size="sm" onClick={confirmDeleteYes}>
                      Yes, Delete
                    </AnimatedButton>
                  </div>
                )}

                {deleteStage === 'password' && (
                  <div className="space-y-3">
                    <p className="text-white/90">Enter password to confirm deletion:</p>
                    <AnimatedInput
                      type="password"
                      value={passwordInput}
                      onChange={setPasswordInput}
                      placeholder="Password"
                      className="max-w-xs"
                    />
                    {deleteError && <p className="text-red-400">{deleteError}</p>}
                    <div className="flex items-center space-x-2">
                      <AnimatedButton variant="secondary" size="sm" onClick={cancelDelete}>
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton variant="destructive" size="sm" onClick={submitDeletePassword}>
                        Confirm Delete
                      </AnimatedButton>
                    </div>
                  </div>
                )}

                {deleteStage === 'locked' && (
                  <p className="text-red-400">
                    Delete disabled due to multiple failed attempts. Please try again later.
                  </p>
                )}
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
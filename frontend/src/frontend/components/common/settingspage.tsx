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
import Background3D from '../animations/3D/Background3D';
import AnimatedCard from '../animations/3D/AnimatedCard';
import AnimatedToggle from '../animations/3D/Animatedtoggle';
import AnimatedInput from '../animations/3D/Animatedinput';
import AnimatedButton from '../common/AnimatedButton';

interface DoctorSettingsProps {
  onBack: () => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DoctorSettings: React.FC<DoctorSettingsProps> = ({ onBack }) => {
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

  // 10. EHR / EMR Integration
  const [ehrKey, setEhrKey] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('daily');

  // 11. Account Management
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deactivated, setDeactivated] = useState(false);
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
    }
  };

  const handleDeactivate = async () => {
    setDeactivated(true);
    setDeactivateConfirm(false);
  };

  const initiateDelete = () => {
    setDeleteError(null);
    setPasswordInput('');
    setDeleteStage('confirm');
  };

  const confirmDeleteYes = () => {
    setDeleteStage('password');
    setDeleteError(null);
    setPasswordInput('');
  };

  const cancelDelete = () => {
    setDeleteStage('none');
    setDeleteError(null);
    setPasswordInput('');
  };

  const submitDeletePassword = async () => {
    setDeleteError(null);
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
        <div className="max-w-6xl mx-auto space-y-8">
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
              Doctor Settings
            </h1>
          </motion.div>

          {/* Availability & Schedule */}
          <AnimatedCard delay={1}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <CalendarIcon className="mr-3 w-6 h-6 text-cyan-400" />
              Availability & Schedule
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-white/90 font-medium mb-3">Weekly Schedule:</p>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                          availableDays.includes(day)
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-transparent shadow-lg'
                            : 'border-white/30 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/90 font-medium mb-3">Break Time:</p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="time"
                      value={breakTime.start}
                      onChange={(e) => setBreakTime((prev) => ({ ...prev, start: e.target.value }))}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    />
                    <span className="text-white/70">to</span>
                    <input
                      type="time"
                      value={breakTime.end}
                      onChange={(e) => setBreakTime((prev) => ({ ...prev, end: e.target.value }))}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-white/90 font-medium mb-3">Appointment Duration:</p>
                  <select
                    value={appointmentDuration}
                    onChange={(e) => setAppointmentDuration(e.target.value)}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="15" className="bg-gray-800">15 minutes</option>
                    <option value="30" className="bg-gray-800">30 minutes</option>
                    <option value="45" className="bg-gray-800">45 minutes</option>
                    <option value="60" className="bg-gray-800">60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-white/90 font-medium mb-3">Date Exceptions:</p>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="date"
                      value={newExceptionDate}
                      onChange={(e) => setNewExceptionDate(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    />
                    <AnimatedButton size="sm" onClick={addException}>
                      Add
                    </AnimatedButton>
                  </div>
                  <div className="space-y-2">
                    {exceptions.map((date) => (
                      <div
                        key={date}
                        className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10"
                      >
                        <span className="text-white">{date}</span>
                        <button 
                          onClick={() => removeException(date)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <AnimatedToggle
                  checked={isClosed}
                  onChange={() => setIsClosed(!isClosed)}
                  label="Emergency Closure"
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Appointment Settings */}
          <AnimatedCard delay={2}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Clock className="mr-3 w-6 h-6 text-cyan-400" />
              Appointment Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-white/90 font-medium mb-3">Consultation Modes:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={modes.inPerson}
                        onChange={() => setModes((prev) => ({ ...prev, inPerson: !prev.inPerson }))}
                        className="w-5 h-5 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/90">In-person</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={modes.video}
                        onChange={() => setModes((prev) => ({ ...prev, video: !prev.video }))}
                        className="w-5 h-5 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/90">Video</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={modes.phone}
                        onChange={() => setModes((prev) => ({ ...prev, phone: !prev.phone }))}
                        className="w-5 h-5 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/90">Phone</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 mb-2">Gap Between (min):</label>
                    <AnimatedInput
                      type="number"
                      value={gapBetween}
                      onChange={setGapBetween}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Max per Day:</label>
                    <AnimatedInput
                      type="number"
                      value={maxPerDay}
                      onChange={setMaxPerDay}
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <AnimatedToggle
                  checked={autoConfirm}
                  onChange={() => setAutoConfirm(!autoConfirm)}
                  label="Auto-confirm Appointments"
                />

                <div>
                  <p className="text-white/90 font-medium mb-3">Buffer Time (minutes):</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-2">Before:</label>
                      <AnimatedInput
                        type="number"
                        value={bufferBefore}
                        onChange={setBufferBefore}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-2">After:</label>
                      <AnimatedInput
                        type="number"
                        value={bufferAfter}
                        onChange={setBufferAfter}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Payment & Fees */}
          <AnimatedCard delay={3}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <CreditCard className="mr-3 w-6 h-6 text-cyan-400" />
              Payment & Fees
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-white/90 font-medium mb-3">Consultation Fees:</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 mb-2">In-person (₹):</label>
                      <AnimatedInput
                        type="number"
                        value={fees.inPerson}
                        onChange={(value) => setFees((prev) => ({ ...prev, inPerson: value }))}
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-2">Video (₹):</label>
                      <AnimatedInput
                        type="number"
                        value={fees.video}
                        onChange={(value) => setFees((prev) => ({ ...prev, video: value }))}
                        placeholder="400"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-2">Phone (₹):</label>
                      <AnimatedInput
                        type="number"
                        value={fees.phone}
                        onChange={(value) => setFees((prev) => ({ ...prev, phone: value }))}
                        placeholder="300"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex space-x-2">
                    <AnimatedInput
                      placeholder="e.g., 10% off 5 sessions"
                      value={packageOffer}
                      onChange={setPackageOffer}
                      className="flex-1"
                    />
                    <AnimatedButton size="sm">Save Offer</AnimatedButton>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex space-x-2">
                    <AnimatedInput
                      placeholder="Account Number / UPI ID"
                      value={bankAccount}
                      onChange={setBankAccount}
                      className="flex-1"
                    />
                    <AnimatedButton size="sm">Verify</AnimatedButton>
                  </div>
                </div>

                <div>
                  <p className="text-white/90 font-medium mb-3">Payment History:</p>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full text-left text-white/90">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((txn, idx) => (
                          <tr key={idx} className="border-t border-white/10">
                            <td className="px-4 py-3">{txn.date}</td>
                            <td className="px-4 py-3">{txn.amount}</td>
                            <td className="px-4 py-3">{txn.mode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Notifications */}
          <AnimatedCard delay={4}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Bell className="mr-3 w-6 h-6 text-cyan-400" />
              Notifications
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <AnimatedToggle
                  checked={emailNotif}
                  onChange={() => setEmailNotif(!emailNotif)}
                  label="Email Notifications"
                />
                
                <AnimatedToggle
                  checked={smsNotif}
                  onChange={() => setSmsNotif(!smsNotif)}
                  label="SMS Notifications"
                />
                
                <div>
                  <p className="text-white/90 font-medium mb-3">Appointment Reminders:</p>
                  <div className="space-y-2 pl-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reminderTimes.dayBefore}
                        onChange={() => setReminderTimes((prev) => ({ ...prev, dayBefore: !prev.dayBefore }))}
                        className="w-4 h-4 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/80">24h before</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reminderTimes.hourBefore}
                        onChange={() => setReminderTimes((prev) => ({ ...prev, hourBefore: !prev.hourBefore }))}
                        className="w-4 h-4 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/80">1h before</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatedToggle
                  checked={notifyMessages}
                  onChange={() => setNotifyMessages(!notifyMessages)}
                  label="Patient Messages"
                />
                
                <AnimatedToggle
                  checked={systemAlerts}
                  onChange={() => setSystemAlerts(!systemAlerts)}
                  label="System Alerts"
                />
                
                <AnimatedToggle
                  checked={pushNotif}
                  onChange={() => setPushNotif(!pushNotif)}
                  label="Push Notifications"
                />
                
                <AnimatedToggle
                  checked={soundAlerts}
                  onChange={() => setSoundAlerts(!soundAlerts)}
                  label="Sound/Popup Alerts"
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Security Settings */}
          <AnimatedCard delay={5}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Lock className="mr-3 w-6 h-6 text-cyan-400" />
              Security Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-white/90 font-medium mb-3">Change Password:</p>
                <div className="space-y-4">
                  <AnimatedInput
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                  />
                  <AnimatedInput
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                  />
                  <AnimatedButton>Update Password</AnimatedButton>
                </div>
              </div>

              <div className="flex items-center">
                <AnimatedToggle
                  checked={enable2FA}
                  onChange={() => setEnable2FA(!enable2FA)}
                  label="Enable Two-Factor Authentication"
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Video Call Setup */}
          <AnimatedCard delay={6}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Video className="mr-3 w-6 h-6 text-cyan-400" />
              Video Call Setup
            </h2>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-white/90 mb-2">Provider:</label>
                <select
                  value={videoProvider}
                  onChange={(e) => setVideoProvider(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="Zoom" className="bg-gray-800">Zoom</option>
                  <option value="Google Meet" className="bg-gray-800">Google Meet</option>
                  <option value="Jitsi" className="bg-gray-800">Jitsi</option>
                </select>
              </div>
              <div className="pt-6">
                <AnimatedButton onClick={() => setTestCall(true)}>
                  Test Connection
                </AnimatedButton>
              </div>
            </div>
            {testCall && <p className="text-emerald-400 mt-4">Connection test successful!</p>}
          </AnimatedCard>

          {/* Communication Settings */}
          <AnimatedCard delay={7}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <MessageCircle className="mr-3 w-6 h-6 text-cyan-400" />
              Communication Settings
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-white/90 mb-2">Auto-response Message:</label>
                <AnimatedInput
                  value={autoResponse}
                  onChange={setAutoResponse}
                  placeholder="I am currently with a patient."
                />
              </div>

              <AnimatedToggle
                checked={chatAvailable}
                onChange={() => setChatAvailable(!chatAvailable)}
                label="Chat Availability"
              />
            </div>
          </AnimatedCard>

          {/* Analytics & Document Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatedCard delay={8}>
              <h2 className="text-2xl font-bold text-white flex items-center mb-6">
                <BarChart className="mr-3 w-6 h-6 text-cyan-400" />
                Analytics
              </h2>

              <div className="space-y-4">
                <AnimatedToggle
                  checked={enableAnalytics}
                  onChange={() => setEnableAnalytics(!enableAnalytics)}
                  label="Enable Analytics"
                />

                <div>
                  <p className="text-white/90 font-medium mb-3">Report Emails:</p>
                  <div className="space-y-2 pl-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reportEmails.daily}
                        onChange={() => setReportEmails((prev) => ({ ...prev, daily: !prev.daily }))}
                        className="w-4 h-4 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/80">Daily</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reportEmails.weekly}
                        onChange={() => setReportEmails((prev) => ({ ...prev, weekly: !prev.weekly }))}
                        className="w-4 h-4 text-cyan-400 bg-white/10 border-white/30 rounded focus:ring-cyan-400 focus:ring-2"
                      />
                      <span className="text-white/80">Weekly</span>
                    </label>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={8}>
              <h2 className="text-2xl font-bold text-white flex items-center mb-6">
                <Download className="mr-3 w-6 h-6 text-cyan-400" />
                Documents
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 mb-2">Upload Certificates:</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={uploadCertificate}
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:text-gray-900 file:font-semibold hover:file:bg-cyan-300"
                  />
                </div>

                <div className="space-y-2">
                  {certificates.map((cert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10"
                    >
                      <span className="text-white">{cert}</span>
                      <button 
                        onClick={() => setCertificates((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <AnimatedButton variant="secondary">
                  Manage Medical Records
                </AnimatedButton>
              </div>
            </AnimatedCard>
          </div>

          {/* EHR Integration */}
          <AnimatedCard delay={9}>
            <h2 className="text-2xl font-bold text-white flex items-center mb-6">
              <Database className="mr-3 w-6 h-6 text-cyan-400" />
              EHR / EMR Integration
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex space-x-2">
                <AnimatedInput
                  placeholder="Enter EHR API Key"
                  value={ehrKey}
                  onChange={setEhrKey}
                  className="flex-1"
                />
                <AnimatedButton>Connect</AnimatedButton>
              </div>

              <div>
                <label className="block text-white/90 mb-2">Sync Frequency:</label>
                <select
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="real-time" className="bg-gray-800">Real-time</option>
                  <option value="hourly" className="bg-gray-800">Hourly</option>
                  <option value="daily" className="bg-gray-800">Daily</option>
                </select>
              </div>
            </div>
          </AnimatedCard>

          {/* Account Management */}
          <AnimatedCard delay={10} className="border-red-500/30 bg-red-900/10">
            <h2 className="text-2xl font-bold text-red-400 flex items-center mb-6">
              <Users className="mr-3 w-6 h-6" />
              Account Management
            </h2>

            <div className="space-y-6">
              {/* Deactivate Account */}
              {!deactivated ? (
                <>
                  {!deactivateConfirm ? (
                    <div className="flex justify-between items-center">
                      <span className="text-red-300">Deactivate Account</span>
                      <AnimatedButton
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeactivateConfirm(true)}
                      >
                        Deactivate
                      </AnimatedButton>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/90">Are you sure you want to deactivate?</span>
                      <AnimatedButton variant="secondary" size="sm" onClick={() => setDeactivateConfirm(false)}>
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton variant="destructive" size="sm" onClick={handleDeactivate}>
                        Yes, Deactivate
                      </AnimatedButton>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-yellow-400">Account deactivated.</p>
              )}

              {/* Delete Account */}
              {deleteStage === 'none' && (
                <div className="flex justify-between items-center">
                  <span className="text-red-300">Permanently Delete Account</span>
                  <AnimatedButton variant="destructive" size="sm" onClick={initiateDelete}>
                    Delete
                  </AnimatedButton>
                </div>
              )}

              {deleteStage === 'confirm' && (
                <div className="flex items-center space-x-4">
                  <span className="text-white/90">
                    Permanent delete? This will remove your doctor account and all associated data.
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
                  <p className="text-white/90">Enter your password to confirm deletion:</p>
                  <AnimatedInput
                    type="password"
                    value={passwordInput}
                    onChange={setPasswordInput}
                    placeholder="Password"
                    className="max-w-xs"
                  />
                  {deleteError && <p className="text-red-400">{deleteError}</p>}
                  <div className="flex items-center space-x-4">
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
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
};

export default DoctorSettings;
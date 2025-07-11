
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  isValid,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

import ThreeBackground from '../../components/animations/doctor/ThreeBackground';
import FloatingNavbar from '../../components/animations/doctor/FloatingNavbar';
import StatsCard from '../../components/animations/doctor/StatsCard';
import AnimatedChart from '../../components/animations/doctor/AnimatedChart';
import ProfileAvatar3D from '../../components/animations/doctor/ProfileAvatar3D';
import EditProfileForm, {
  LocationType,
} from '../../components/common/editprofile/editprofileformsdoc';

import seatImg from '../../assets/chair.avif';
import doctorSeatImg from '../../assets/doctorseat.png';

interface DoctorAppointment {
  id: string;
  patientName: string;
  date: string;
  status: 'upcoming' | 'completed' | 'pending' | 'cancelled';
  createdAt: string; // track booking time
}

interface AppointmentDetail {
  id: string;
  datetime: string;
  status: string;
  patient: {
    name: string;
    email: string;
    phone: string;
    message?: string;
  };
}

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type TabKey =
  | 'overview'
  | 'appointments'
  | 'patients'
  | 'earnings'
  | 'messages'
  | 'profile'
  | 'payout';

export default function DocDashboardPage() {
  const { user, logout, fetchDoctorProfile, updateDoctorProfile } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || '';
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  /*** State ***/
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Profile
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>();
  const [profileExperience, setProfileExperience] = useState('');
  const [profileLocationData, setProfileLocationData] = useState<LocationType | null>(null);
  const [profileLocation, setProfileLocation] = useState('');
  const [profileConsultationFee, setProfileConsultationFee] = useState(0);

  // Appointments & notifications
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Appointment detail & cancel
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState<AppointmentDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Payout
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStatusMsg, setPayoutStatusMsg] = useState<string | null>(null);
  const [existingPayoutAccountId, setExistingPayoutAccountId] = useState<string | null>(null);

  const fetchedProfileRef = useRef(false);

  /*** Handlers ***/
  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveProfile = async (
    name: string,
    email: string,
    specialty: string,
    file: File | null,
    experience: string,
    location: string,
    fee: number
  ) => {
    setProfileError('');
    try {
      const updated = await updateDoctorProfile({
        name,
        email,
        specialty,
        profileImageFile: file,
        experience,
        location,
        consultationFee: fee,
      });
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      setProfileSpecialty(updated.specialty || '');
      setProfileExperience(updated.experience || '');
      setProfileConsultationFee(updated.consultationFee ?? 0);
      const loc = updated.location as LocationType;
      if (loc?.lat != null) {
        setProfileLocationData(loc);
        setProfileLocation(loc.address);
      }
      setProfileImageUrl(file ? URL.createObjectURL(file) : updated.profileImageUrl);
      setShowEditProfile(false);
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message || 'Failed to save profile');
    }
  };

  /*** Data Fetching ***/
  useEffect(() => {
    if (user?.role === 'doctor' && !fetchedProfileRef.current) {
      fetchedProfileRef.current = true;
      fetchDoctorProfile()
        .then((prof) => {
          setProfileName(prof.name);
          setProfileEmail(prof.email);
          setProfileSpecialty(prof.specialty || '');
          setProfileImageUrl(prof.profileImageUrl);
          setProfileExperience(prof.experience || '');
          setProfileConsultationFee(prof.consultationFee ?? 0);
          const loc = prof.location as LocationType;
          if (loc?.lat != null) {
            setProfileLocationData(loc);
            setProfileLocation(loc.address);
          }
          setExistingPayoutAccountId((prof as any).razorpayAccountId || null);
        })
        .catch((err) => {
          console.error(err);
          setProfileError(err.message || 'Failed to load profile');
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [user, fetchDoctorProfile]);

  useEffect(() => {
    if (!token) return;

    axios
      .get<DoctorAppointment[]>(buildUrl('/appointments/doctor'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // assume API returns a `createdAt` timestamp
        const sorted = res.data
          .filter(a => a.status !== 'cancelled')
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setAppointments(sorted);
        setUpcomingCount(
          sorted.filter((a) => a.status === 'upcoming' && new Date(a.date) > new Date()).length
        );
      })
      .catch(console.error);

    axios
      .get<NotificationItem[]>(buildUrl('/notifications'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.read).length);
      })
      .catch(console.error);
  }, [token]);

  /*** Chart Data ***/
  const weeklyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(now, 6 - i);
      return {
        date: format(day, 'MMM d'),
        count: appointments.filter(
          (a) =>
            format(new Date(a.date), 'yyyy-MM-dd') ===
            format(day, 'yyyy-MM-dd')
        ).length,
      };
    });
  }, [appointments]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const m = subMonths(now, 11 - i);
      return {
        month: format(m, 'MMM yyyy'),
        count: appointments.filter(
          (a) =>
            format(new Date(a.date), 'yyyy-MM') ===
            format(m, 'yyyy-MM')
        ).length,
      };
    });
  }, [appointments]);

  const yearlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }).map((_, i) => {
      const y = subYears(now, 4 - i);
      return {
        year: format(y, 'yyyy'),
        count: appointments.filter(
          (a) =>
            format(new Date(a.date), 'yyyy') ===
            format(y, 'yyyy')
        ).length,
      };
    });
  }, [appointments]);

  /*** Slot grouping & FCFS ordering ***/
  const slotGroups = useMemo(() => {
    const groups: Record<string, DoctorAppointment[]> = {};
    if (user?.availabilitySlots) {
      user.availabilitySlots.forEach((slotIso) => {
        const label = format(new Date(slotIso), 'PPP p');
        groups[label] = [];
      });
    }
    appointments.forEach((a) => {
      const label = format(new Date(a.date), 'PPP p');
      if (groups[label]) groups[label].push(a);
      else {
        groups.Other = groups.Other || [];
        groups.Other.push(a);
      }
    });
    // Already in FCFS order by createdAt from fetch hook
    return groups;
  }, [appointments, user]);

  /*** Appointment detail fetch ***/
  const fetchAppointmentDetails = async (id: string) => {
    setDetailsLoading(true);
    setShowCancelConfirm(false);
    try {
      const res = await axios.get<any>(buildUrl(`/appointments/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data;
      setSelectedAppointmentDetail({
        id: d._id,
        datetime: d.datetime,
        status: d.status,
        patient: {
          name: d.patient.name,
          email: d.patient.email,
          phone: d.patient.phone,
          message: d.patient.message,
        },
      });
    } catch (err) {
      console.error('Failed to fetch details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  /*** Cancel appointment ***/
  const handleCancelAppointment = async () => {
    if (!selectedAppointmentDetail) return;
    setCancelling(true);
    try {
      await axios.post(
        buildUrl(`/appointments/${selectedAppointmentDetail.id}/cancel`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments((prev) =>
        prev.filter((a) => a.id !== selectedAppointmentDetail.id)
      );
      setSelectedAppointmentDetail(null);
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Cancel failed', err);
    } finally {
      setCancelling(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await axios.put(
        buildUrl(`/notifications/${id}/read`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((n) =>
        n.map((x) => (x._id === id ? { ...x, read: true } : x))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    } catch (err) {
      console.error(err);
    }
  };

  // Early return AFTER hooks
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Loading profile...
      </div>
    );
  }

  /*** Render ***/
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <ThreeBackground activeTab={activeTab} />
      <FloatingNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        upcomingCount={upcomingCount}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      <div className="px-6 pt-24 pb-12 mx-auto max-w-7xl">
        {/* Header & Edit Profile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-16 space-y-4"
        >
          <ProfileAvatar3D imageUrl={profileImageUrl} name={profileName} size={150} />
          <motion.h1
            className="text-6xl font-bold text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Welcome Back, Dr. {profileName}
          </motion.h1>
          <motion.button
            onClick={() => setShowEditProfile(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center px-4 py-2 text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
          >
            <Pencil className="w-5 h-5 mr-2" /> Edit Profile
          </motion.button>
        </motion.div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="w-full max-w-lg p-8 bg-gray-800 rounded-2xl"
              >
                <EditProfileForm
                  currentName={profileName}
                  currentEmail={profileEmail}
                  currentSpecialty={profileSpecialty}
                  currentProfileImageUrl={profileImageUrl}
                  currentExperience={profileExperience}
                  currentLocation={profileLocationData}
                  currentConsultationFee={profileConsultationFee}
                  onCancel={() => setShowEditProfile(false)}
                  onSave={handleSaveProfile}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Upcoming Appointments"
            value={upcomingCount}
            icon={Calendar}
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
            glowColor="blue"
          />
          <StatsCard
            title="Total Patients"
            value={new Set(appointments.map((a) => a.patientName)).size}
            icon={Users}
            gradient="from-green-500 to-emerald-500"
            delay={0.2}
            glowColor="green"
          />
          <StatsCard
            title="Monthly Earnings"
            value={`₹${(appointments.length * profileConsultationFee).toLocaleString()}`}
            icon={DollarSign}
            gradient="from-yellow-500 to-orange-500"
            delay={0.3}
            glowColor="yellow"
          />
          <StatsCard
            title="Notifications"
            value={unreadCount}
            icon={Bell}
            gradient="from-purple-500 to-pink-500"
            delay={0.4}
            glowColor="purple"
          />
        </div>

        {/* Tabs Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <AnimatedChart
                  data={weeklyData}
                  title="Weekly Appointments"
                  dataKey="count"
                  xAxisKey="date"
                  color="cyan"
                  delay={0.1}
                  type="area"
                />
                <AnimatedChart
                  data={monthlyData}
                  title="Monthly Trends"
                  dataKey="count"
                  xAxisKey="month"
                  color="purple"
                  delay={0.3}
                  type="line"
                />
              </div>
              <AnimatedChart
                data={yearlyData}
                title="Yearly Trends"
                dataKey="count"
                xAxisKey="year"
                color="pink"
                delay={0.5}
                type="line"
              />
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Appointments</h2>
              <ul className="space-y-2">
                {appointments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl"
                  >
                    <div>
                      <p className="text-white">{a.patientName}</p>
                      <p className="text-gray-400">
                        {format(new Date(a.date), 'PPP p')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        a.status === 'upcoming'
                          ? 'bg-blue-600 text-white'
                          : a.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : a.status === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-white">Seating Chart</h2>
              <div className="flex justify-center mb-6">
                <img src={doctorSeatImg} alt="Doctor Seat" className="w-16 h-16" />
              </div>
              {Object.entries(slotGroups).map(([slot, appts]) => (
                <div key={slot} className="mb-8">
                  <h3 className="mb-2 text-xl font-semibold text-white">{slot}</h3>
                  <div className="grid grid-cols-5 gap-4 justify-items-center">
                    {appts.length > 0
                      ? appts.map((a) => (
                          <div
                            key={a.id}
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => fetchAppointmentDetails(a.id)}
                          >
                            <img src={seatImg} alt="Seat" className="w-12 h-12" />
                            <span className="w-16 mt-1 text-sm text-center text-white truncate">
                              {a.patientName}
                            </span>
                          </div>
                        ))
                      : Array.from({ length: user?.maxPatients || 5 }).map((_, i) => (
                          <img
                            key={i}
                            src={seatImg}
                            alt="Empty Seat"
                            className="w-12 h-12 opacity-30"
                          />
                        ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Earnings</h2>
              <p className="text-white">Total appointments: {appointments.length}</p>
              <p className="text-white">
                Total earnings: ₹{(appointments.length * profileConsultationFee).toLocaleString()}
              </p>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={`p-4 rounded-xl flex justify-between items-center ${
                      n.read ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-white'
                    }`}
                  >
                    <span>{n.message}</span>
                    {!n.read && (
                      <button
                        onClick={() => markNotificationRead(n._id)}
                        className="ml-4 text-blue-400 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="p-8 space-y-4 text-white bg-gray-800 rounded-2xl"
            >
              <h2 className="text-3xl font-bold">My Profile</h2>
              <div className="flex items-center space-x-6">
                <ProfileAvatar3D imageUrl={profileImageUrl} name={profileName} size={100} />
                <div className="space-y-2">
                  <p><strong>Name:</strong> {profileName}</p>
                  <p><strong>Email:</strong> {profileEmail}</p>
                  <p><strong>Specialty:</strong> {profileSpecialty}</p>
                  <p><strong>Experience:</strong> {profileExperience} years</p>
                  <p><strong>Location:</strong> {profileLocation}</p>
                  <p><strong>Consultation Fee:</strong> ₹{profileConsultationFee.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payout' && (
            <motion.div
              key="payout"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Payout Account</h2>
              {existingPayoutAccountId ? (
                <p className="text-white">Account ID: {existingPayoutAccountId}</p>
              ) : (
                <form onSubmit={async (e: FormEvent) => {
                    e.preventDefault();
                    setPayoutLoading(true);
                    setPayoutStatusMsg(null);
                    try {
                      const { data } = await axios.post(
                        buildUrl('/medical/doctor/payout-account'),
                        {
                          accountHolderName: bankAccountName.trim(),
                          accountNumber: bankAccountNumber.trim(),
                          ifsc: bankIFSC.trim(),
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setExistingPayoutAccountId(data.fundAccountId || data.razorpayAccountId);
                      setPayoutStatusMsg('Payout account added successfully.');
                      setBankAccountName(''); setBankAccountNumber(''); setBankIFSC('');
                    } catch (err: any) {
                      console.error(err);
                      setPayoutStatusMsg(err.message || 'Failed to add payout account');
                    } finally {
                      setPayoutLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={bankAccountName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBankAccountName(e.target.value)}
                    required
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bankAccountNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBankAccountNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={bankIFSC}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBankIFSC(e.target.value)}
                    required
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="px-6 py-2 text-white bg-indigo-600 rounded-xl disabled:opacity-50"
                  >
                    {payoutLoading ? 'Adding...' : 'Add Account'}
                  </button>
                  {payoutStatusMsg && <p className="text-white">{payoutStatusMsg}</p>}
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Appointment Details & Cancel Modal */}
      <AnimatePresence>
        {selectedAppointmentDetail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md p-6 bg-gray-800 rounded-xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              {detailsLoading ? (
                <p className="text-white">Loading details...</p>
              ) : showCancelConfirm ? (
                <>
                  <h3 className="mb-4 text-xl font-bold text-white">
                    Are you sure you want to cancel this appointment?
                  </h3>
                  <p className="mb-6 text-gray-300">
                    This will refund the patient’s consultation fee and send them a notification.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-2 font-medium text-white bg-gray-600 rounded-xl hover:bg-gray-500"
                    >
                      No, Go Back
                    </button>
                    <button
                      onClick={handleCancelAppointment}
                      disabled={cancelling}
                      className="flex-1 py-2 font-medium text-white bg-red-600 rounded-xl hover:bg-red-500 disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {selectedAppointmentDetail.patient.name}
                  </h3>
                  <p className="mb-1 text-gray-300">
                    <strong>Slot:</strong>{' '}
                    {isValid(new Date(selectedAppointmentDetail.datetime))
                      ? format(
                          new Date(selectedAppointmentDetail.datetime),
                          'PPP p'
                        )
                      : 'Invalid Date'}
                  </p>
                  <p className="mb-1 text-gray-300">
                    <strong>Status:</strong> {selectedAppointmentDetail.status}
                  </p>
                  <p className="mb-1 text-gray-300">
                    <strong>Email:</strong> {selectedAppointmentDetail.patient.email || 'N/A'}
                  </p>
                  <p className="mb-1 text-gray-300">
                    <strong>Phone:</strong> {selectedAppointmentDetail.patient.phone || 'N/A'}
                  </p>
                  <p className="mb-4 text-gray-300">
                    <strong>Message:</strong> {selectedAppointmentDetail.patient.message || '—'}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex-1 px-4 py-2 text-white bg-red-600 rounded-xl hover:bg-red-500"
                    >
                      Cancel Appointment
                    </button>
                    <button
                      onClick={() => setSelectedAppointmentDetail(null)}
                      className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="w-full max-w-md p-8 border bg-black/80 backdrop-blur-xl border-white/20 rounded-3xl"
            >
              <h3 className="mb-4 text-2xl font-bold text-white">Confirm Logout</h3>
              <p className="mb-6 text-gray-300">Are you sure you want to logout?</p>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3 font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-xl"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmLogout}
                  className="flex-1 py-3 font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {profileError && (
        <div className="max-w-3xl p-3 mx-auto mt-4 text-white bg-red-600 rounded">
          {profileError}
        </div>
      )}
    </div>
  );
}

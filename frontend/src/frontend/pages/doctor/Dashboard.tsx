// File: frontend/src/pages/docdashboardpage.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isValid, subMonths, subYears } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  Pencil,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

import { useAuth } from '../../../contexts/AuthContext';
import ThreeBackground from '../../components/animations/doctor/ThreeBackground';
import FloatingNavbar from '../../components/animations/doctor/FloatingNavbar';
import StatsCard from '../../components/animations/doctor/StatsCard';
import AnimatedChart from '../../components/animations/doctor/AnimatedChart';
import ProfileAvatar3D from '../../components/animations/doctor/ProfileAvatar3D';
import EditProfileForm, { LocationType } from '../../components/common/editprofile/editprofileformsdoc';
import { PayoutSetupForm } from '../../components/PayoutSetupForm';
import seatImg from '../../assets/chair.avif';
import doctorSeatImg from '../../assets/doctorseat.png';
import 'react-toastify/dist/ReactToastify.css';

interface DoctorAppointment {
  id: string;
  patientName: string;
  date: string;
  createdAt?: string;
  status: 'upcoming' | 'completed' | 'pending' | 'cancelled';
  amount: number;
}

function getBookedDate(a: DoctorAppointment): Date {
  if (a.createdAt) {
    return new Date(a.createdAt);
  }
  const ts = parseInt(a.id.slice(0, 8), 16) * 1000;
  return new Date(ts);
}

interface AppointmentDetail {
  id: string;
  datetime: string;
  status: string;
  patient: {
    id: string;
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
  const {
    user,
    logout,
    fetchDoctorProfile,
    updateDoctorProfile,
    setupPayout,
    executePayout,
  } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || '';
  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  // UI State
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Profile Fields
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLanguages, setProfileLanguages] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>();
  const [profileExperience, setProfileExperience] = useState('');
  const [profileLocationData, setProfileLocationData] = useState<LocationType | null>(null);
  const [profileLocation, setProfileLocation] = useState('');
  const [profileConsultationFee, setProfileConsultationFee] = useState(0);

  // Appointments & Notifications
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(null);
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

// Controls visibility of the “Cancel All” confirmation modal
const [showSlotCancelConfirm, setShowSlotCancelConfirm] = useState<boolean>(false);

// Tracks whether the slot‑cancellation API call is in progress
const [cancellingSlot, setCancellingSlot] = useState<boolean>(false);
  // Appointment Detail / Cancel / Prescription
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState<AppointmentDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    medicineName: '',
    timesPerDay: 1,
    intervalDays: 1,
    durationDays: 1,
    beginDate: '',
    endDate: '',
  });
  const [issuingPrescription, setIssuingPrescription] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState('');

  // Payout Setup & Execute
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [existingPayoutAccountId, setExistingPayoutAccountId] = useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const fetchedProfileRef = useRef(false);

  // —— Clean Slots Feature ——  
  // Tracks which ISO slots have been hidden
 const [hiddenSlots, setHiddenSlots] = useState<string[]>(() => {
  try {
    const stored = localStorage.getItem('hiddenSlots');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});

// Whenever hiddenSlots changes (e.g. via handleHideExpiredSlots), persist it:
useEffect(() => {
  try {
    localStorage.setItem('hiddenSlots', JSON.stringify(hiddenSlots));
  } catch {
    // ignore write errors
  }
}, [hiddenSlots]);


  // Logout handlers
  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Save profile
  const handleSaveProfile = async (
    name: string,
    email: string,
    bio: string,
    specialty: string,
    file: File | null,
    experience: string,
    location: string,
    languages: string,
    fee: number
  ) => {
    setProfileError('');
    try {
      const updated = await updateDoctorProfile({
        name,
        email,
        bio,
        specialty,
        languages,
        profileImageFile: file,
        experience,
        location,
        consultationFee: fee,
      });
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      setProfileBio(updated.bio);
      setProfileLanguages(updated.languages);
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

  // Fetch profile once
  useEffect(() => {
    if (user?.role === 'doctor' && !fetchedProfileRef.current) {
      fetchedProfileRef.current = true;
      fetchDoctorProfile()
        .then((prof) => {
          setProfileName(prof.name);
          setProfileEmail(prof.email);
          setProfileBio(prof.bio);
          setProfileLanguages(prof.languages);
          setProfileSpecialty(prof.specialty || '');
          setProfileImageUrl(prof.profileImageUrl);
          setProfileExperience(prof.experience || '');
          setProfileConsultationFee(prof.consultationFee ?? 0);
          const loc = prof.location as LocationType;
          if (loc?.lat != null) {
            setProfileLocationData(loc);
            setProfileLocation(loc.address);
          }
          setExistingPayoutAccountId((prof as any).razorpayFundAccountId || null);
        })
        .catch((err) => {
          console.error(err);
          setProfileError(err.message || 'Failed to load profile');
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [user, fetchDoctorProfile]);

  // Fetch appointments & notifications
  useEffect(() => {
    if (!token) return;

    axios
      .get<DoctorAppointment[]>(buildUrl('/appointments/doctor'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const filtered = res.data.filter((a) => a.status !== 'cancelled');
        const sorted = filtered.sort(
          (a, b) => getBookedDate(a).getTime() - getBookedDate(b).getTime()
        );
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

  // Stats data
  const weeklyData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - i));
      const label = format(day, 'MMM d');
      const count = appointments.filter((a) => {
        const booked = getBookedDate(a);
        return isValid(booked) && format(booked, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      }).length;
      return { date: label, count };
    });
  }, [appointments]);

  const monthlyData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const m = subMonths(today, 11 - i);
      const label = format(m, 'MMM yyyy');
      const count = appointments.filter((a) => {
        const booked = getBookedDate(a);
        return isValid(booked) && format(booked, 'yyyy-MM') === format(m, 'yyyy-MM');
      }).length;
      return { month: label, count };
    });
  }, [appointments]);

  const yearlyData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 5 }).map((_, i) => {
      const y = subYears(today, 4 - i);
      const label = format(y, 'yyyy');
      const count = appointments.filter((a) => {
        const booked = getBookedDate(a);
        return isValid(booked) && format(booked, 'yyyy') === format(y, 'yyyy');
      }).length;
      return { year: label, count };
    });
  }, [appointments]);
  

  // Group into slots
  const slotGroups = useMemo<Record<string, DoctorAppointment[]>>(() => {
    const groups: Record<string, DoctorAppointment[]> = {};
    user?.availabilitySlots?.forEach((iso) => {
      groups[iso] = [];
    });
    appointments.forEach((appt) => {
      const iso = appt.date;
      if (groups[iso]) groups[iso].push(appt);
      else {
        groups['Other'] = groups['Other'] ?? [];
        groups['Other'].push(appt);
      }
    });
    return groups;
  }, [appointments, user]);

  // Filter out hidden slots
  const displayedSlotGroups = useMemo(() => {
    return Object.entries(slotGroups).reduce((acc, [iso, appts]) => {
      if (!hiddenSlots.includes(iso) && appts.length > 0) {
        acc[iso] = appts;
      }
      return acc;
    }, {} as Record<string, DoctorAppointment[]>);
  }, [slotGroups, hiddenSlots]);

  // Detect any expired slot left
  const hasExpiredSlot = useMemo(() => {
    return Object.keys(displayedSlotGroups).some((iso) => {
      const t = new Date(iso).getTime();
      return !isNaN(t) && t < Date.now();
    });
  }, [displayedSlotGroups]);

  // Hide expired slots locally
 const handleHideExpiredSlots = () => {
  // find all expired slot keys
  const expired = Object.keys(displayedSlotGroups).filter((iso) => {
    const t = new Date(iso).getTime();
    return !isNaN(t) && t < Date.now();
  });

  if (expired.length === 0) {
    toast.info('No expired slots to hide.');
    return;
  }

  // update state (and trigger the effect to write to localStorage)
  setHiddenSlots((prev) => {
    // dedupe just in case
    const updated = Array.from(new Set([...prev, ...expired]));
    return updated;
  });

  toast.success(`Hidden ${expired.length} expired slot${expired.length > 1 ? 's' : ''}.`);
};





  // Cancel a single appointment
  const fetchAppointmentDetails = async (id: string) => {
    setDetailsLoading(true);
    setShowCancelConfirm(false);
    setPrescriptionError('');
    try {
      const res = await axios.get<any>(
        buildUrl(`/appointments/${id}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = res.data;
      setSelectedAppointmentDetail({
        id: d._id,
        datetime: d.datetime,
        status: d.status,
        patient: {
          id: d.patient._id,
          name: d.patient.name,
          email: d.patient.email,
          phone: d.patient.phone,
          message: d.patient.message,
        },
      });
    } catch {
      toast.error('Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentDetail) return;
    setCancelling(true);
    try {
      await axios.post(
        buildUrl(
          `/appointments/${selectedAppointmentDetail.id}/cancel`
        ),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments((prev) =>
        prev.filter(
          (a) => a.id !== selectedAppointmentDetail.id
        )
      );
      setSelectedAppointmentDetail(null);
      setShowCancelConfirm(false);
      toast.success('Appointment cancelled');
    } catch {
      toast.error('Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  // Bulk slot cancellation
  const openSlotCancel = (slotLabel: string) => {
    setSelectedSlotLabel(slotLabel);
    setShowSlotCancelConfirm(true);
  };
  const closeSlotCancel = () => {
    setShowSlotCancelConfirm(false);
    setSelectedSlotLabel(null);
  };
 const handleCancelSlot = async () => {
  if (!selectedSlotLabel) return;
  setCancellingSlot(true);
  try {
    const res = await axios.post(
      buildUrl('/appointments/cancel-slot'),
      { slotLabel: selectedSlotLabel },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Remove cancelled appointments matching the ISO slot
    setAppointments((prev) =>
      prev.filter((appt) => appt.date !== selectedSlotLabel)
    );

    toast.success(
      `Cancelled ${res.data.cancelledCount} appointments, refunded ${res.data.refundedCount}.`
    );
    closeSlotCancel();
  } catch (err) {
    console.error(err);
    toast.error('Failed to cancel slot');
  } finally {
    setCancellingSlot(false);
  }
};


  // Helper to disable Cancel All if within 24 hours
  const isWithin24Hours = (slotLabel: string) => {
    const slotDate = new Date(slotLabel);
    return slotDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  };

  // --- Prescription ---
  const openPrescriptionForm = () => setShowPrescriptionForm(true);
  const closePrescriptionForm = () => {
    setShowPrescriptionForm(false);
    setPrescriptionError('');
    setPrescriptionData({
      medicineName: '',
      timesPerDay: 1,
      intervalDays: 1,
      durationDays: 1,
      beginDate: '',
      endDate: '',
    });
  };

  const handlePrescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrescriptionData(prev => ({
      ...prev,
      [name]: name.includes('Date') ? value : Number(value) || value,
    }));
  };

  const submitPrescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentDetail) return;
    setIssuingPrescription(true);
    try {
      await axios.post(
        buildUrl(`/appointments/${selectedAppointmentDetail.id}/prescription`),
        { prescriptionItems: [prescriptionData] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Prescription issued!');
      closePrescriptionForm();
      setSelectedAppointmentDetail(null);
    } catch {
      setPrescriptionError('Failed to issue prescription');
    } finally {
      setIssuingPrescription(false);
    }
  };

  // --- Payout ---
  const handleSetupPayout = async (data: {
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  }) => {
    setPayoutLoading(true);
    try {
      const res = await setupPayout(data);
      setExistingPayoutAccountId((res as any).fundAccountId);
      toast.success('Payout account configured');
    } catch {
      toast.error('Payout setup failed');
    } finally {
      setPayoutLoading(false);
      setShowPayoutModal(false);
    }
  };

  const handleExecutePayout = async (appt: DoctorAppointment) => {
    try {
      const paise = Math.round(appt.amount * 100 * 0.9);
      await executePayout(user!.id, paise, appt.id);
      toast.success('Payout sent');
    } catch {
      toast.error('Payout failed');
    }
  };
const fetchAppointments = async () => {
  try {
    const res = await axios.get(`http://localhost:4000/api/appointments/doctor/${user._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Filter for only active future slots
    const activeAppointments = res.data.filter(
      (appt) => appt.isSlotActive && new Date(appt.date) >= new Date()
    );

    setAppointments(activeAppointments);
  } catch (err) {
    console.error('Failed to fetch appointments', err);
  }
};



const handleCleanSlots = async () => {
  try {
    await axios.put(
      `http://localhost:4000/api/appointments/clean-slots/${user._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    toast.success('Expired appointment slots cleaned!');
    fetchAppointments(); // Refresh the active ones
  } catch (err) {
    console.error(err);
    toast.error('Failed to clean slots');
  }
};


  // Determine if there are past appointments to clean
  const hasPastSlots = useMemo(
    () => appointments.some(a => new Date(a.date).getTime() < Date.now()),
    [appointments]
  );

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Loading profile...
      </div>
    );
  }

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
          <ProfileAvatar3D  name={profileName} size={150} />
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
                className="w-full max-w-lg p-8 bg-gray-800 rounded-2xl max-h-[90vh] overflow-y-auto"
              >
                <EditProfileForm
                  currentName={profileName}
                  currentEmail={profileEmail}
                  currentBio={profileBio}
                  currentlanguages={profileLanguages}
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
            title="Bookings This Week"
            value={weeklyData.reduce((sum, d) => sum + d.count, 0)}
            icon={Calendar}
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
            glowColor="blue"
          />
          <StatsCard
            title="Total Patients"
            value={new Set(appointments.map(a => a.patientName)).size}
            icon={Users}
            gradient="from-green-500 to-emerald-500"
            delay={0.2}
            glowColor="green"
          />
          <StatsCard
            title="Bookings This Month"
            value={monthlyData.reduce((sum, d) => sum + d.count, 0)}
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

        {/* Tabbed Content */}
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
                  title="Weekly Bookings"
                  dataKey="count"
                  xAxisKey="date"
                  color="cyan"
                  delay={0.1}
                  type="line"
                />
                <AnimatedChart
                  data={monthlyData}
                  title="Monthly Bookings"
                  dataKey="count"
                  xAxisKey="month"
                  color="purple"
                  delay={0.3}
                  type="line"
                />
              </div>
              <AnimatedChart
                data={yearlyData}
                title="Yearly Bookings"
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

    {/* Clean Slots Button */}
    <AnimatePresence>
      {hasExpiredSlot && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-end"
        >
          <button
            onClick={handleHideExpiredSlots}
            className="px-4 py-2 mb-4 text-white bg-red-500 rounded-xl hover:bg-red-600"
          >
            Clean Slots
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Render Appointments */}
    {Object.entries(displayedSlotGroups).map(([slotIso, appts]) => {
      const parsedDate = new Date(slotIso);
      const isValidDate = !isNaN(parsedDate.getTime());
      const label = isValidDate ? format(parsedDate, 'PPP p') : slotIso;
      const disabled = !isValidDate || isWithin24Hours(slotIso);

      return (
        <div key={slotIso} className="mb-8">
          <div className="flex items-center justify-between">
            <h3 className="mb-2 text-xl font-semibold text-white">{label}</h3>
            <button
              onClick={() => isValidDate && openSlotCancel(slotIso)}
              disabled={disabled}
              className={`
                px-3 py-1 text-sm rounded
                ${disabled
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-red-100 text-red-500 hover:bg-red-200'}
              `}
            >
              Cancel All
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4 mt-2 justify-items-center">
            {appts.map((a, index) => (
              <div
                key={a.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => fetchAppointmentDetails(a.id)}
              >
                <img src={seatImg} alt={`Seat ${index + 1}`} className="w-12 h-12" />
                <span className="mt-1 text-xs text-white">Seat {index + 1}</span>
                <span className="w-16 mt-1 text-sm text-center text-white truncate">
                  {a.patientName}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    })}
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
                        onClick={() => {
                          axios
                            .put(buildUrl(`/notifications/${n._id}/read`), {}, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            .then(() => {
                              setNotifications(prev =>
                                prev.map(x => x._id === n._id ? { ...x, read: true } : x)
                              );
                              setUnreadCount(c => Math.max(c - 1, 0));
                            })
                            .catch(console.error);
                        }}
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
                  <p><strong>Bio:</strong> {profileBio}</p>
                  <p><strong>Languages:</strong> {profileLanguages}</p>
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
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="px-6 py-2 text-white bg-green-500 rounded-xl hover:bg-green-600"
                >
                  Setup Payout Account
                </button>
              )}
              <h3 className="mt-8 text-xl font-semibold text-white">Execute Payouts</h3>
              <ul className="space-y-4">
                {appointments
                  .filter(a => a.status === 'completed')
                  .map(a => (
                    <li
                      key={a.id}
                      className="flex justify-between p-4 bg-gray-800 rounded-xl"
                    >
                      <span>{a.patientName} — ₹{a.amount}</span>
                      {existingPayoutAccountId && (
                        <button
                          onClick={() => handleExecutePayout(a)}
                          className="px-4 py-1 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
                        >
                          Pay Out
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payout Setup Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <PayoutSetupForm
            onClose={() => setShowPayoutModal(false)}
            onSubmit={handleSetupPayout}
            loading={payoutLoading}
          />
        )}
      </AnimatePresence>

      {/* Appointment Details / Cancel / Prescription Modal */}
      <AnimatePresence>
        {selectedAppointmentDetail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md p-6 bg-gray-800 rounded-xl max-h-[90vh] overflow-y-auto"
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
              ) : showPrescriptionForm ? (
                <form onSubmit={submitPrescription} className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Issue Prescription</h3>
                  <div className="space-y-2">
                    <input
                      name="medicineName"
                      placeholder="Medicine Name"
                      value={prescriptionData.medicineName}
                      onChange={handlePrescriptionChange}
                      required
                      className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                    />
                    <input
                      name="timesPerDay"
                      type="number"
                      min={1}
                      placeholder="Times per Day"
                      value={prescriptionData.timesPerDay}
                      onChange={handlePrescriptionChange}
                      required
                      className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                    />
                    <input
                      name="intervalDays"
                      type="number"
                      min={1}
                      placeholder="Interval of Days"
                      value={prescriptionData.intervalDays}
                      onChange={handlePrescriptionChange}
                      required
                      className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                    />
                    <input
                      name="durationDays"
                      type="number"
                      min={1}
                      placeholder="Duration (Days)"
                      value={prescriptionData.durationDays}
                      onChange={handlePrescriptionChange}
                      required
                      className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                    />
                    <input
                      name="beginDate"
                      type="date"
                      value={prescriptionData.beginDate}
                      onChange={handlePrescriptionChange}
                      required
                      className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                    />
                    <input
                      name="endDate"
                      type="date"
                      value={prescriptionData.endDate}
                      onChange={handlePrescriptionChange}
                      required
                      className="w-full px-4 py-2 text-white bg-gray-700 rounded-xl"
                    />
                    {prescriptionError && (
                      <p className="text-red-400">{prescriptionError}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={closePrescriptionForm}
                      className="flex-1 py-2 text-white bg-gray-600 rounded-xl hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={issuingPrescription}
                      className="flex-1 py-2 text-white bg-green-600 rounded-xl disabled:opacity-50"
                    >
                      {issuingPrescription ? 'Issuing...' : 'Issue Prescription'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {selectedAppointmentDetail.patient.name}
                  </h3>
                  <p className="mb-1 text-gray-300">
                    <strong>Slot:</strong>{' '}
                    {isValid(new Date(selectedAppointmentDetail.datetime))
                      ? format(new Date(selectedAppointmentDetail.datetime), 'PPP p')
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
                  <div className="flex mb-4 space-x-2">
                    <button
                      onClick={openPrescriptionForm}
                      className="flex items-center justify-center flex-1 px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-500"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Issue Prescription
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex-1 px-4 py-2 text-white bg-red-600 rounded-xl hover:bg-red-500"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedAppointmentDetail(null)}
                    className="w-full py-2 text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
                  >
                    Close
                  </button>
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
      <AnimatePresence>
        {showSlotCancelConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md p-6 bg-gray-800 rounded-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h3 className="mb-4 text-xl font-bold text-white">
                Cancel All Appointments for "{selectedSlotLabel}"
              </h3>
              <p className="mb-6 text-gray-300">
                This will cancel all appointments in this time slot, refund patients,
                and send them notifications.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={closeSlotCancel}
                  className="flex-1 py-2 text-white bg-gray-600 rounded-xl hover:bg-gray-500"
                >
                  No, Go Back
                </button>
                <button
                  onClick={handleCancelSlot}
                  disabled={cancellingSlot}
                  className="flex-1 py-2 text-white bg-red-600 rounded-xl hover:bg-red-500 disabled:opacity-50"
                >
                  {cancellingSlot ? 'Cancelling...' : 'Yes, Cancel All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
<AnimatePresence>
        {showSlotCancelConfirm && selectedSlotLabel && (
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
              className="w-full max-w-sm p-6 bg-white rounded-lg"
            >
              <h2 className="mb-4 text-xl font-semibold">
                Cancel all appointments for:
              </h2>
              <p className="mb-6 font-medium">{selectedSlotLabel}</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeSlotCancel}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  No
                </button>
                <button
                  onClick={handleCancelSlot}
                  disabled={cancellingSlot}
                  className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {cancellingSlot ? 'Cancelling...' : 'Yes, Cancel All'}
                </button>
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

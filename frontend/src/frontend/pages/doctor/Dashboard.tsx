// File: frontend/src/pages/DocDashboardPage.tsx

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
  Activity,
  User as UserIcon,
  Menu,
  X,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '../../../contexts/AuthContext';
import ThreeBackground from '../../components/animations/doctor/ThreeBackground';
import FloatingNavbar from '../../components/animations/doctor/FloatingNavbar';
import StatsCard from '../../components/animations/doctor/StatsCard';
import AnimatedChart from '../../components/animations/doctor/AnimatedChart';
import ProfileAvatar3D from '../../components/animations/doctor/ProfileAvatar3D';
import EditProfileForm, {
  LocationType,
} from '../../components/common/editprofile/editprofileformsdoc';
import { PayoutSetupForm } from '../../components/PayoutSetupForm';
import AppointmentDetailModal from '../../components/common/bookappointment/bookappointment';

import { Button } from '../../components/common/Button';
import seatImg from '../../assets/chair.avif';
import doctorSeatImg from '../../assets/doctorseat.png';

interface DoctorAppointment {
  id: string;
  patientName: string;
  date: string;
  createdAt?: string;
  status: 'upcoming' | 'completed' | 'pending' | 'cancelled';
  amount: number;
}

function getBookedDate(a: DoctorAppointment): Date {
  if (a.createdAt) return new Date(a.createdAt);
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

export default function DocDashboardPage() {
  // Auth & routing
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

  // Prevent double-fetch
  const fetchedProfileRef = useRef(false);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<
    'overview' | 'appointments' | 'patients' | 'earnings' | 'messages' | 'profile' | 'payout'
  >('overview');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLanguages, setProfileLanguages] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>();
  const [profileExperience, setProfileExperience] = useState('');
  const [profileLocationData, setProfileLocationData] =
    useState<LocationType | null>(null);
  const [profileConsultationFee, setProfileConsultationFee] = useState(0);

  // Appointments & counts
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Hidden slots persistence
  const [hiddenSlots, setHiddenSlots] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hiddenSlots') || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('hiddenSlots', JSON.stringify(hiddenSlots));
  }, [hiddenSlots]);

  // Detail / cancellation / prescription
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] =
    useState<AppointmentDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Bulk slot cancellation
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(
    null
  );
  const [showSlotCancelConfirm, setShowSlotCancelConfirm] = useState(false);
  const [cancellingSlot, setCancellingSlot] = useState(false);

  // Prescription form
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

  // Payout modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [existingPayoutAccountId, setExistingPayoutAccountId] =
    useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Fetch doctor profile once
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
          setProfileExperience(prof.experience || '');
          setProfileConsultationFee(prof.consultationFee ?? 0);
          const loc = prof.location as LocationType;
          if (loc?.lat != null) setProfileLocationData(loc);
          setProfileImageUrl(prof.profileImageUrl);
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

    // Appointments
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
          sorted.filter((a) => a.status === 'upcoming' && new Date(a.date) > new Date())
            .length
        );
      })
      .catch(console.error);

    // Notifications
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

  // Slot grouping
  const slotGroups = useMemo(() => {
    const groups: Record<string, DoctorAppointment[]> = {};
    user?.availabilitySlots?.forEach((iso) => {
      groups[iso] = [];
    });
    appointments.forEach((appt) => {
      if (groups[appt.date]) groups[appt.date].push(appt);
      else {
        groups['Other'] = groups['Other'] || [];
        groups['Other'].push(appt);
      }
    });
    return groups;
  }, [appointments, user]);

  const displayedSlotGroups = useMemo(() => {
    const acc: Record<string, DoctorAppointment[]> = {};
    Object.entries(slotGroups).forEach(([iso, appts]) => {
      if (!hiddenSlots.includes(iso) && appts.length > 0) acc[iso] = appts;
    });
    return acc;
  }, [slotGroups, hiddenSlots]);

  const hasExpiredSlot = useMemo(
    () =>
      Object.keys(displayedSlotGroups).some((iso) => {
        const t = new Date(iso).getTime();
        return !isNaN(t) && t < Date.now();
      }),
    [displayedSlotGroups]
  );

  const handleHideExpiredSlots = () => {
    const expired = Object.keys(displayedSlotGroups).filter((iso) => {
      const t = new Date(iso).getTime();
      return !isNaN(t) && t < Date.now();
    });
    if (!expired.length) {
      toast.info('No expired slots to hide.');
      return;
    }
    setHiddenSlots((prev) => Array.from(new Set([...prev, ...expired])));
    toast.success(`Hidden ${expired.length} expired slot(s).`);
  };

  // Fetch appointment detail
  const fetchAppointmentDetails = async (id: string) => {
    setDetailsLoading(true);
    setShowCancelConfirm(false);
    setPrescriptionError('');
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

  // Cancel single appointment
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
      toast.success('Appointment cancelled');
    } catch {
      toast.error('Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  // Bulk slot cancel
  const openSlotCancel = (slotIso: string) => {
    setSelectedSlotLabel(slotIso);
    setShowSlotCancelConfirm(true);
  };
  const closeSlotCancel = () => setShowSlotCancelConfirm(false);
  const handleCancelSlot = async () => {
    if (!selectedSlotLabel) return;
    setCancellingSlot(true);
    try {
      const res = await axios.post(
        buildUrl('/appointments/cancel-slot'),
        { slotLabel: selectedSlotLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments((prev) =>
        prev.filter((a) => a.date !== selectedSlotLabel)
      );
      toast.success(
        `Cancelled ${res.data.cancelledCount} appts, refunded ${res.data.refundedCount}.`
      );
      closeSlotCancel();
    } catch {
      toast.error('Failed to cancel slot');
    } finally {
      setCancellingSlot(false);
    }
  };

  const isWithin24Hours = (iso: string) =>
    new Date(iso).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  // Prescription form
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
    setPrescriptionData((p) => ({
      ...p,
      [name]: name.includes('Date') ? value : Number(value) || value,
    }));
  };
  const submitPrescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentDetail) return;
    setIssuingPrescription(true);
    try {
      await axios.post(
        buildUrl(
          `/appointments/${selectedAppointmentDetail.id}/prescription`
        ),
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

  // Payout
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

  // Logout
  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

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

      {/* Navbar */}
      <div className="fixed z-50 w-full px-4 sm:px-6 lg:px-8 top-4">
        <FloatingNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          upcomingCount={upcomingCount}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Menu Toggle */}
      <div className="fixed z-50 top-4 right-4 sm:hidden">
        <button
          onClick={() => setIsMobileMenuOpen((p) => !p)}
          className="p-2 text-white rounded-full bg-black/60 backdrop-blur"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobileMenu"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="fixed z-50 p-4 top-16 left-4 right-4 bg-black/80 backdrop-blur-xl rounded-xl sm:hidden"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'overview', icon: Activity, label: 'Overview' },
                { id: 'appointments', icon: Calendar, label: 'Appointments' },
                { id: 'patients', icon: Users, label: 'Patients' },
                { id: 'earnings', icon: DollarSign, label: 'Earnings' },
                { id: 'messages', icon: Bell, label: 'Messages' },
                { id: 'profile', icon: UserIcon, label: 'Profile' },
               
              ].map(({ id, icon: Icon, label }) => {
                const isActive = activeTab === id;
                const badge =
                  id === 'appointments'
                    ? upcomingCount
                    : id === 'messages'
                    ? unreadCount
                    : 0;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveTab(id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center p-3 rounded-xl transition ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-sm">{label}</span>
                    {badge > 0 && (
                      <span className="inline-block px-2 mt-1 text-xs font-bold bg-red-500 rounded-full">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-2 mt-4 text-red-400 bg-red-500/20 rounded-xl hover:bg-red-500/30"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <div className="px-6 pt-24 pb-12 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-16 space-y-4"
        >
          <ProfileAvatar3D name={profileName} size={150} />
          <motion.h1
            className="text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Welcome,<br />Dr. {profileName}
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-lg p-8 bg-gray-800 rounded-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
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
                  onSave={async (
                    name,
                    email,
                    bio,
                    specialty,
                    file,
                    experience,
                    location,
                    languages,
                    fee
                  ) => {
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
                      if (loc?.lat != null) setProfileLocationData(loc);
                      setProfileImageUrl(
                        file ? URL.createObjectURL(file) : updated.profileImageUrl
                      );
                      setShowEditProfile(false);
                    } catch (err: any) {
                      console.error(err);
                      toast.error(err.message || 'Failed to save profile');
                    }
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
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
            title="Total Patients completed"
            value={new Set(appointments.map((a) => a.patientName)).size}
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab weeklyData={weeklyData} monthlyData={monthlyData} yearlyData={yearlyData} />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsTab appointments={appointments} fetchAppointmentDetails={fetchAppointmentDetails} />
          )}
          {activeTab === 'patients' && (
            <PatientsTab
              displayedSlotGroups={displayedSlotGroups}
              hasExpiredSlot={hasExpiredSlot}
              handleHideExpiredSlots={handleHideExpiredSlots}
              openSlotCancel={openSlotCancel}
              isWithin24Hours={isWithin24Hours}
              fetchAppointmentDetails={fetchAppointmentDetails}
            />
          )}
          {activeTab === 'earnings' && <EarningsTab appointments={appointments} fee={profileConsultationFee} />}
          {activeTab === 'messages' && (
            <MessagesTab
              token={token}
              buildUrl={buildUrl}
              setUnreadCount={setUnreadCount}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileTab
              profile={{
                name: profileName,
                email: profileEmail,
                specialty: profileSpecialty,
                experience: profileExperience,
                location: profileLocationData?.address || '',
                fee: profileConsultationFee,
                bio: profileBio,
                languages: profileLanguages,
                imageUrl: profileImageUrl,
              }}
            />
          )}
          {activeTab === 'payout' && (
            <PayoutTab
              existingAccountId={existingPayoutAccountId}
              onSetup={() => setShowPayoutModal(true)}
              appointments={appointments}
              onExecute={handleExecutePayout}
            />
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

      {/* Appointment Detail / Cancel / Prescription Modal */}
      <AnimatePresence>
        {selectedAppointmentDetail && (
          <AppointmentDetailModal
            detail={selectedAppointmentDetail}
            loading={detailsLoading}
            showCancelConfirm={showCancelConfirm}
            onOpenPrescription={openPrescriptionForm}
            onClose={() => setSelectedAppointmentDetail(null)}
            onCancelConfirm={() => setShowCancelConfirm(true)}
            onCancel={handleCancelAppointment}
            cancelling={cancelling}
            showPrescriptionForm={showPrescriptionForm}
            prescriptionData={prescriptionData}
            onPrescriptionChange={handlePrescriptionChange}
            onPrescriptionSubmit={submitPrescription}
            issuingPrescription={issuingPrescription}
            prescriptionError={prescriptionError}
          />
        )}
      </AnimatePresence>

      {/* Cancel Slot Confirmation */}
      <AnimatePresence>
        {showSlotCancelConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md p-6 bg-gray-800 rounded-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h3 className="mb-4 text-xl font-bold text-white">
                Cancel All Appointments for “{selectedSlotLabel}”
              </h3>
              <p className="mb-6 text-gray-300">
                This will cancel all appointments in this slot, refund patients, and send notifications.
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

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md p-8 border bg-black/80 rounded-3xl border-white/20"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h3 className="mb-4 text-2xl font-bold text-white">Confirm Logout</h3>
              <p className="mb-6 text-gray-300">Are you sure you want to logout?</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3 text-white bg-gray-600 rounded-xl hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:from-red-600 hover:to-pink-600"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Error Banner */}
      {profileError && (
        <div className="fixed px-6 py-3 text-white transform -translate-x-1/2 bg-red-600 shadow-lg bottom-4 left-1/2 rounded-xl">
          {profileError}
        </div>
      )}
    </div>
  );
}

/** --- Sub-components below (unchanged) --- **/

// OverviewTab
function OverviewTab({
  weeklyData,
  monthlyData,
  yearlyData,
}: {
  weeklyData: { date: string; count: number }[];
  monthlyData: { month: string; count: number }[];
  yearlyData: { year: string; count: number }[];
}) {
  return (
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
  );
}

// AppointmentsTab
function AppointmentsTab({
  appointments,
  fetchAppointmentDetails,
}: {
  appointments: DoctorAppointment[];
  fetchAppointmentDetails: (id: string) => void;
}) {
  return (
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
          <motion.li
            key={a.id}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center justify-between p-4 rounded-xl bg-violet-200 bg-opacity-20 backdrop-blur-sm"
            onClick={() => fetchAppointmentDetails(a.id)}
          >
            <div>
              <p className="text-white">{a.patientName}</p>
              <p className="text-gray-300">{format(new Date(a.date), 'PPP p')}</p>
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
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// PatientsTab
function PatientsTab({
  displayedSlotGroups,
  hasExpiredSlot,
  handleHideExpiredSlots,
  openSlotCancel,
  isWithin24Hours,
  fetchAppointmentDetails,
}: {
  displayedSlotGroups: Record<string, DoctorAppointment[]>;
  hasExpiredSlot: boolean;
  handleHideExpiredSlots: () => void;
  openSlotCancel: (iso: string) => void;
  isWithin24Hours: (iso: string) => boolean;
  fetchAppointmentDetails: (id: string) => void;
}) {
  return (
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
      {hasExpiredSlot && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleHideExpiredSlots}
            className="px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600"
          >
            Clean Slots
          </button>
        </div>
      )}
      {Object.entries(displayedSlotGroups).map(([slotIso, appts]) => {
        const parsed = new Date(slotIso);
        const validDate = !isNaN(parsed.getTime());
        const label = validDate ? format(parsed, 'PPP p') : slotIso;
        const disabled = !validDate || isWithin24Hours(slotIso);

        return (
          <div key={slotIso} className="mb-8">
            <div className="flex items-center justify-between">
              <h3 className="mb-2 text-xl font-semibold text-white">{label}</h3>
              <button
                onClick={() => validDate && openSlotCancel(slotIso)}
                disabled={disabled}
                className={`px-3 py-1 text-sm rounded ${
                  disabled
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-red-100 text-red-500 hover:bg-red-200'
                }`}
              >
                Cancel All
              </button>
            </div>
            <div className="grid grid-cols-5 gap-4 mt-2 justify-items-center">
              {appts.map((a, idx) => (
                <div
                  key={a.id}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => fetchAppointmentDetails(a.id)}
                >
                  <img src={seatImg} alt={`Seat ${idx + 1}`} className="w-12 h-12" />
                  <span className="mt-1 text-xs text-white">Seat {idx + 1}</span>
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
  );
}

// EarningsTab
function EarningsTab({ appointments, fee }: { appointments: DoctorAppointment[]; fee: number }) {
  return (
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
        Total earnings: ₹{(appointments.length * fee).toLocaleString()}
      </p>
    </motion.div>
  );
}

// ProfileTab
function ProfileTab({
  profile,
}: {
  profile: {
    name: string;
    email: string;
    specialty: string;
    experience: string;
    location: string;
    fee: number;
    bio: string;
    languages: string;
    imageUrl?: string;
  };
}) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-4 text-white bg-gray-800 rounded-2xl"
    >
      <h2 className="text-3xl font-bold">My Profile</h2>
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
        <ProfileAvatar3D imageUrl={profile.imageUrl} name={profile.name} size={100} />
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Specialty:</strong> {profile.specialty}
          </p>
          <p>
            <strong>Experience:</strong> {profile.experience} years
          </p>
          <p>
            <strong>Location:</strong> {profile.location}
          </p>
          <p>
            <strong>Consultation Fee:</strong> ₹{profile.fee.toLocaleString()}
          </p>
          <p>
            <strong>Bio:</strong> {profile.bio}
          </p>
          <p>
            <strong>Languages:</strong> {profile.languages}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
interface MessagesTabProps {
  token: string;
  buildUrl: (path: string) => string;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}
// MessagesTab
  function MessagesTab({
  token,
  buildUrl,
  setUnreadCount,
}: MessagesTabProps) {
  const [messages, setMessages] = useState<NotificationItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedPositions, setDraggedPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios
      .get<NotificationItem[]>(buildUrl('/notifications'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!alive) return;
        setMessages(res.data);
        setUnreadCount(res.data.filter((m) => !m.read).length);
      })
      .catch(() => toast.error('Couldn’t load messages. Please try again.'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, buildUrl, setUnreadCount]);

  const markRead = async (id: string) => {
    try {
      await axios.put(
        buildUrl(`/notifications/${id}/read`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, read: true } : m))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    } catch {
      toast.error('Failed to mark message read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(buildUrl(`/notifications/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== id));
      setUnreadCount((c) =>
        Math.max(c - (messages.find((m) => m._id === id)?.read ? 0 : 1), 0)
      );
    } catch {
      toast.error('Failed to delete message.');
    }
  };

  // ✅ Key line: decide what to display
  const displayedMessages = showAll ? messages : messages.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-full px-4 mx-auto space-y-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold text-white sm:text-2xl">Messages</h2>
        {messages.length > 4 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-blue-400 sm:mt-0 border-blue-400/30 hover:bg-blue-500/10"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'View Less' : 'View All'}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-300">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-center text-gray-300">No messages.</p>
      ) : (
        displayedMessages.map((msg) => {
          const xOffset = draggedPositions[msg._id] || 0;
          return (
            <div key={msg._id} className="relative group">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
                animate={{
                  opacity: draggedId === msg._id ? 1 : 0,
                  scale: draggedId === msg._id ? 1 : 0.8,
                  rotateY: draggedId === msg._id ? 0 : 45,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute z-10 flex items-center space-x-2 transform -translate-y-1/2 pointer-events-none right-4 top-1/2 group-hover:pointer-events-auto"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  className="px-3 py-1 text-white bg-red-600 rounded-lg shadow-lg"
                  onClick={() => handleDelete(msg._id)}
                >
                  <Trash2 size={16} />
                </Button>
                <motion.button
                  onClick={() => {
                    setDraggedId(null);
                    setDraggedPositions((p) => ({ ...p, [msg._id]: 0 }));
                  }}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.8, rotate: -15 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-white/10"
                >
                  <X size={16} className="text-white" />
                </motion.button>
              </motion.div>

              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) {
                    setDraggedId(msg._id);
                    setDraggedPositions((p) => ({ ...p, [msg._id]: -80 }));
                  } else {
                    setDraggedId(null);
                    setDraggedPositions((p) => ({ ...p, [msg._id]: 0 }));
                  }
                }}
                style={{ x: xOffset }}
                animate={{ x: xOffset }}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`p-4 sm:p-6 rounded-xl transition-all duration-300 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between ${
                  msg.read ? 'text-gray-300' : 'text-white'
                }`}
              >
                <span className="flex-1 text-sm sm:text-base">{msg.message}</span>
                {!msg.read && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="mt-3 text-blue-400 sm:mt-0 sm:ml-4 border-blue-400/30 hover:bg-blue-500/10"
                    onClick={() => markRead(msg._id)}
                  >
                    Mark read
                  </Button>
                )}
              </motion.div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}
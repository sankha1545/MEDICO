// File: src/pages/doctor/DoctorDashboardPage.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, subMonths, subYears, startOfMonth, startOfYear } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Bell,
  User as UserIcon,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Pencil,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import {
  FadeIn,
  SlideIn,
  StaggeredContainer,
  staggeredItemVariants,
} from '../../components/animations/Transitions';
import EditProfileForm from '../../components/common/editprofile/editprofileformsdoc'; // adjust as needed

// Recharts imports
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

// Seat UI component
const Seat: React.FC<{
  status: 'empty' | 'completed' | 'missed';
  index: number;
  onMarkComplete: (i: number) => void;
  onMarkMissed: (i: number) => void;
}> = ({ status, index, onMarkComplete, onMarkMissed }) => {
  const baseClass =
    'w-12 h-12 border-2 rounded-md flex items-center justify-center m-1';
  let bgClass = 'bg-white border-gray-300';
  if (status === 'completed') bgClass = 'bg-green-500 border-green-700';
  if (status === 'missed') bgClass = 'bg-red-500 border-red-700';

  return (
    <div className={`${baseClass} ${bgClass}`}>
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 bg-transparent border border-current rounded-sm" />
        <p className="text-xs text-white mt-1">{index + 1}</p>
        <div className="flex space-x-1 mt-2">
          <button
            onClick={() => onMarkComplete(index)}
            className="text-white text-sm"
            title="Mark Completed"
          >
            ✓
          </button>
          <button
            onClick={() => onMarkMissed(index)}
            className="text-white text-sm"
            title="Mark Missed"
          >
            ✗
          </button>
        </div>
      </div>
    </div>
  );
};

type TabKey = 'overview' | 'appointments' | 'patients' | 'earnings' | 'messages' | 'profile';
const tabs: TabKey[] = ['overview', 'appointments', 'patients', 'earnings', 'messages', 'profile'];

interface DoctorAppointment {
  id: string;
  patientName: string;
  date: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
}
interface DoctorMessage {
  id: string;
  from: string;
  content: string;
  date: Date;
  read: boolean;
}
interface PatientRecord {
  id: string;
  name: string;
  lastVisit: Date;
  condition: string;
}

const DoctorDashboardPage: React.FC = () => {
  const { user, logout, fetchDoctorProfile, updateDoctorProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  const fetchedRef = useRef(false);

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDob, setProfileDob] = useState(''); // "YYYY-MM-DD"
  const [profileLocationObj, setProfileLocationObj] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [profileAvailabilitySlots, setProfileAvailabilitySlots] = useState<string[]>([]);
  const [profileNextSlots, setProfileNextSlots] = useState<string[]>([]);
  const [profileMaxPatients, setProfileMaxPatients] = useState<number>(1);
  const [profileExperience, setProfileExperience] = useState<string>('');
  const [profileConsultationFee, setProfileConsultationFee] = useState<number>(0);

  // Seat statuses
  const [seatStatuses, setSeatStatuses] = useState<'empty' | 'completed' | 'missed'[]>([]);

  // Mock data placeholders; replace with real fetches
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);

  // Computed stats
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;
  const totalPatients = patients.length;
  const earningsThisMonth = 5200; // placeholder or computed
  const unreadMessages = messages.filter(m => !m.read).length;

  // Determine API base for building image URLs if needed
  let API_BASE = import.meta.env.VITE_API_URL || '';
  API_BASE = API_BASE.replace(/\/$/, '');
  const buildUrl = (path: string) =>
    API_BASE.endsWith('/api') ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;

  // Fetch profile once
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.role === 'doctor' && !fetchedRef.current) {
        fetchedRef.current = true;
        setLoadingProfile(true);
        try {
          const prof = await fetchDoctorProfile();
          // prof fields: name, email, specialty, profileImageUrl, phone, dob, locationObj, availabilitySlots, maxPatients, experience, consultationFee, nextSlots...
          setProfileName(prof.name);
          setProfileEmail(prof.email);
          setProfileSpecialty(prof.specialty || '');
          // Build full URL if needed
          if (prof.profileImageUrl) {
            // If returned URL is relative (starts with '/'), prefix API_BASE
            if (prof.profileImageUrl.startsWith('http')) {
              setProfileImageUrl(prof.profileImageUrl);
            } else {
              setProfileImageUrl(buildUrl(prof.profileImageUrl));
            }
          } else {
            setProfileImageUrl(undefined);
          }
          setProfilePhone(prof.phone || '');
          setProfileDob(prof.dob || '');
          if (prof.locationObj) {
            setProfileLocationObj({
              lat: prof.locationObj.lat,
              lng: prof.locationObj.lng,
              address: prof.locationObj.address,
            });
          } else {
            setProfileLocationObj(null);
          }
          setProfileAvailabilitySlots(Array.isArray(prof.availabilitySlots) ? prof.availabilitySlots : []);
          // Compute nextSlots locally if not provided
          let next: string[] = [];
          if (Array.isArray(prof.nextSlots) && prof.nextSlots.length > 0) {
            next = prof.nextSlots;
          } else {
            const now = new Date();
            next = (prof.availabilitySlots || [])
              .map(s => new Date(s))
              .filter(d => !isNaN(d.getTime()) && d > now)
              .sort((a, b) => a.getTime() - b.getTime())
              .slice(0, 5)
              .map(d => d.toISOString());
          }
          setProfileNextSlots(next);
          const maxP = prof.maxPatients ?? 1;
          setProfileMaxPatients(maxP);
          setProfileExperience(prof.experience || '');
          setProfileConsultationFee(prof.consultationFee ?? 0);
          // Initialize seats UI
          setSeatStatuses(Array(maxP).fill('empty'));
        } catch (err: any) {
          console.error('Failed to load doctor profile:', err);
          setProfileError(err.message || 'Failed to load profile');
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    loadProfile();
  }, [user, fetchDoctorProfile]);

  // TODO: fetch appointments/messages/patients from API
  useEffect(() => {
    // e.g.
    // fetchDoctorAppointments().then(setAppointments);
    // fetchDoctorMessages().then(setMessages);
    // fetchDoctorPatients().then(setPatients);
  }, []);

  const handleMarkComplete = (idx: number) => {
    setSeatStatuses(prev => prev.map((s, i) => (i === idx ? 'completed' : s)));
  };
  const handleMarkMissed = (idx: number) => {
    setSeatStatuses(prev => prev.map((s, i) => (i === idx ? 'missed' : s)));
  };

  // Save updated profile
  const handleSaveProfile = async (
    name: string,
    email: string,
    specialty: string,
    profileImageFile: File | null,
    availabilitySlots: string[],
    locationObj: { lat: number; lng: number; address: string },
    maxPatients: number,
    dob: string,
    experience: string,
    hospitalAffiliation?: string,
    bio?: string,
    qualifications?: string[],
    languages?: string[],
    consultationFee?: number
  ) => {
    setProfileError('');
    try {
      const updated = await updateDoctorProfile({
        name,
        email,
        specialty,
        profileImageFile,
        availabilitySlots,
        location: locationObj,
        maxPatients,
        dob,
        experience,
        hospitalAffiliation,
        bio,
        qualifications,
        languages,
        consultationFee,
      });
      // Update local state
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      setProfileSpecialty(updated.specialty || '');
      if (profileImageFile) {
        // Show local preview
        setProfileImageUrl(URL.createObjectURL(profileImageFile));
      } else if (updated.profileImageUrl) {
        if (updated.profileImageUrl.startsWith('http')) {
          setProfileImageUrl(updated.profileImageUrl);
        } else {
          setProfileImageUrl(buildUrl(updated.profileImageUrl));
        }
      }
      setProfilePhone(updated.phone || '');
      setProfileDob(updated.dob || '');
      if (updated.locationObj) {
        setProfileLocationObj({
          lat: updated.locationObj.lat,
          lng: updated.locationObj.lng,
          address: updated.locationObj.address,
        });
      } else {
        setProfileLocationObj(null);
      }
      setProfileAvailabilitySlots(Array.isArray(updated.availabilitySlots) ? updated.availabilitySlots : []);
      // Recompute next slots
      const now = new Date();
      const next = (updated.availabilitySlots || [])
        .map(s => new Date(s))
        .filter(d => !isNaN(d.getTime()) && d > now)
        .sort((a, b) => a.getTime() - b.getTime())
        .slice(0, 5)
        .map(d => d.toISOString());
      setProfileNextSlots(next);
      const maxP = updated.maxPatients ?? 1;
      setProfileMaxPatients(maxP);
      setProfileExperience(updated.experience || '');
      setProfileConsultationFee(updated.consultationFee ?? 0);
      setSeatStatuses(Array(maxP).fill('empty'));
      setShowEditProfile(false);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setProfileError(err.message || 'Failed to save profile');
    }
  };

  // Chart data (weekly/monthly/yearly)
  const weeklyData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const key = format(day, 'yyyy-MM-dd');
      const count = appointments.filter(a => format(a.date, 'yyyy-MM-dd') === key).length;
      data.push({ date: format(day, 'MMM d'), count });
    }
    return data;
  }, [appointments]);

  const monthlyData = useMemo(() => {
    const data: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const key = format(startOfMonth(m), 'yyyy-MM');
      const count = appointments.filter(a => format(a.date, 'yyyy-MM') === key).length;
      data.push({ month: format(m, 'MMM yyyy'), count });
    }
    return data;
  }, [appointments]);

  const yearlyData = useMemo(() => {
    const data: { year: string; count: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const y = subYears(new Date(), i);
      const key = format(startOfYear(y), 'yyyy');
      const count = appointments.filter(a => format(a.date, 'yyyy') === key).length;
      data.push({ year: format(y, 'yyyy'), count });
    }
    return data;
  }, [appointments]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <FadeIn>
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-full h-full p-4 text-gray-500" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-100 tracking-tight">
                  Dr. {profileName}
                </h1>
                {profileSpecialty && (
                  <p className="text-gray-400">{profileSpecialty}</p>
                )}
              </div>
              <motion.button
                onClick={() => setShowEditProfile(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl"
              >
                <Pencil className="w-5 h-5" /> <span>Edit Profile</span>
              </motion.button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="mt-4 md:mt-0"
            >
              <LogOut className="mr-2 w-4 h-4" /> Logout
            </Button>
          </header>
        </FadeIn>

        {showEditProfile && (
          <EditProfileForm
            currentName={profileName}
            currentEmail={profileEmail}
            currentSpecialty={profileSpecialty}
            currentProfileImageUrl={profileImageUrl}
            currentAvailabilitySlots={profileAvailabilitySlots}
            currentLocation={profileLocationObj ?? undefined}
            currentMaxPatients={profileMaxPatients}
            currentDob={profileDob}
            currentExperience={profileExperience}
            currentConsultationFee={profileConsultationFee}
            onCancel={() => setShowEditProfile(false)}
            onSave={handleSaveProfile}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: 'Upcoming Appointments',
              value: upcomingCount,
              icon: <Calendar className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-blue-700 to-blue-900',
            },
            {
              title: 'Total Patients',
              value: totalPatients,
              icon: <Users className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-indigo-700 to-indigo-900',
            },
            {
              title: 'Earnings This Month',
              value: `$${earningsThisMonth}`,
              icon: <DollarSign className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-green-700 to-green-900',
            },
            {
              title: 'Unread Messages',
              value: unreadMessages,
              icon: <Bell className="w-6 h-6 text-white" />,
              gradient: 'bg-gradient-to-br from-purple-700 to-purple-900',
            },
          ].map((stat, idx) => (
            <SlideIn key={idx} direction="up" delay={idx * 0.1}>
              <div
                className={`${stat.gradient} rounded-2xl shadow-lg overflow-hidden text-white`}
              >
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-white bg-opacity-25 mr-4">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 mb-12 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-2 px-5 py-3 ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>
                  {{
                    overview: <Activity className="w-5 h-5" />,
                    appointments: <Calendar className="w-5 h-5" />,
                    patients: <Users className="w-5 h-5" />,
                    earnings: <DollarSign className="w-5 h-5" />,
                    messages: <Bell className="w-5 h-5" />,
                    profile: <UserIcon className="w-5 h-5" />,
                  }[tab]}
                </span>
                <span className="capitalize font-medium">{tab}</span>
              </button>
            ))}
          </div>
          <div className="p-8 text-gray-100">
            {/* Overview */}
            {activeTab === 'overview' && (
              <StaggeredContainer>
                <div className="space-y-8">
                  {/* Weekly Graph */}
                  <SlideIn direction="up" delay={0.1}>
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        Last 7 Days: Appointments
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={weeklyData}>
                          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis allowDecimals={false} stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#4ade80"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SlideIn>
                  {/* Monthly Graph */}
                  <SlideIn direction="up" delay={0.2}>
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        Last 12 Months: Appointments
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis allowDecimals={false} stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SlideIn>
                  {/* Yearly Graph */}
                  <SlideIn direction="up" delay={0.3}>
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        Last 5 Years: Appointments
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={yearlyData}>
                          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                          <XAxis dataKey="year" stroke="#888" />
                          <YAxis allowDecimals={false} stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#facc15"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SlideIn>
                  {/* Today's Summary */}
                  <div className="space-y-8">
                    <h2 className="text-2xl font-semibold text-gray-100">
                      Today's Summary
                    </h2>
                    {appointments.filter(
                      a => format(a.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ).length ? (
                      appointments
                        .filter(
                          a => format(a.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        )
                        .map(a => (
                          <motion.div
                            key={a.id}
                            variants={staggeredItemVariants}
                            className="bg-gray-800 rounded-lg shadow-sm p-5 flex justify-between items-center hover:shadow-md transition-shadow"
                          >
                            <div>
                              <p className="font-semibold text-gray-100">
                                {a.patientName}
                              </p>
                              <p className="text-gray-400 mt-1">
                                {format(a.date, 'h:mm a')}
                              </p>
                            </div>
                            <Button variant="primary" size="sm">
                              Details
                            </Button>
                          </motion.div>
                        ))
                    ) : (
                      <p className="text-gray-400">
                        No appointments scheduled for today.
                      </p>
                    )}
                  </div>
                </div>
              </StaggeredContainer>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                {appointments.map(a => (
                  <motion.div
                    key={a.id}
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-semibold text-gray-100">
                        {a.patientName}
                      </p>
                      <p className="text-gray-400 mt-1">
                        {format(a.date, 'MMMM d, yyyy h:mm a')}
                      </p>
                      <span
                        className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${
                          a.status === 'upcoming'
                            ? 'bg-yellow-600 text-yellow-100'
                            : a.status === 'completed'
                            ? 'bg-green-600 text-green-100'
                            : 'bg-red-600 text-red-100'
                        }`}
                      >
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      {a.status === 'upcoming' ? (
                        <>
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="primary" size="sm">
                            Start Visit
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm">
                          View Notes
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {appointments.length === 0 && (
                  <p className="text-gray-400">No appointments to show.</p>
                )}
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Patient Records & Seats</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Patient Records */}
                  <div className="space-y-4">
                    <h3 className="text-xl text-gray-100">Patient Records</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {patients.map(p => (
                        <motion.div
                          key={p.id}
                          variants={staggeredItemVariants}
                          className="bg-gray-800 rounded-xl p-6 flex flex-col"
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-100">
                                {p.name}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                Last visit: {format(p.lastVisit, 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <p className="flex-1 text-gray-100">
                            Condition: {p.condition}
                          </p>
                          <Link to={`/doctor/patients/${p.id}`}>
                            <Button variant="link" size="sm">
                              View Record
                            </Button>
                          </Link>
                        </motion.div>
                      ))}
                      {patients.length === 0 && (
                        <p className="text-gray-400">No patients to show.</p>
                      )}
                    </div>
                  </div>

                  {/* Seat UI */}
                  <div>
                    <h3 className="text-xl text-gray-100">Patient Admission Seats</h3>
                    <div className="flex flex-wrap p-4 bg-gray-700 rounded-xl">
                      {seatStatuses.map((status, idx) => (
                        <Seat
                          key={idx}
                          index={idx}
                          status={status}
                          onMarkComplete={handleMarkComplete}
                          onMarkMissed={handleMarkMissed}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-gray-100">
                  Earnings Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-wide">
                      This Month
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-100">
                      ${earningsThisMonth}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={staggeredItemVariants}
                    className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-gray-400 uppercase tracking-wide">
                      Total to Date
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-100">
                      $32,450
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                {messages.map(m => (
                  <motion.div
                    key={m.id}
                    variants={staggeredItemVariants}
                    className={`bg-gray-800 rounded-lg shadow-sm p-5 flex justify-between hover:shadow-md transition-shadow ${
                      m.read
                        ? 'border border-gray-700'
                        : 'border-2 border-blue-600 bg-blue-900'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-100">{m.from}</p>
                      <p className="text-sm text-gray-200 mt-1">{m.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(m.date, 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!m.read && (
                      <span className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></span>
                    )}
                  </motion.div>
                ))}
                {messages.length === 0 && (
                  <p className="text-gray-400">No messages to show.</p>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  variants={staggeredItemVariants}
                  className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-100 mb-5">
                    Profile Details
                  </h3>
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-full h-full p-4 text-gray-500" />
                      )}
                    </div>
                    <div className="space-y-3 text-gray-100 flex-1">
                      <div>
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="font-medium">Dr. {profileName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="font-medium">{profileEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Specialty</p>
                        <p className="font-medium">{profileSpecialty || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="font-medium">{profilePhone || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date of Birth</p>
                        <p className="font-medium">{profileDob || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p className="font-medium">
                          {profileLocationObj?.address || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Experience</p>
                        <p className="font-medium">
                          {profileExperience || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Consultation Fee (INR)</p>
                        <p className="font-medium">
                          {profileConsultationFee != null
                            ? `₹ ${profileConsultationFee}`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Available Slots</p>
                        {profileAvailabilitySlots && profileAvailabilitySlots.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {profileAvailabilitySlots.map((slot, idx) => {
                              let display = slot;
                              try {
                                const dt = new Date(slot);
                                if (!isNaN(dt.getTime())) {
                                  display = format(dt, 'MMM d, yyyy h:mm a');
                                }
                              } catch {}
                              return (
                                <li key={idx} className="font-medium">
                                  {display}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="font-medium text-gray-400">Not set</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Next Slots</p>
                        {profileNextSlots && profileNextSlots.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {profileNextSlots.map((slot, idx) => {
                              let display = slot;
                              try {
                                const dt = new Date(slot);
                                if (!isNaN(dt.getTime())) {
                                  display = format(dt, 'MMM d, yyyy h:mm a');
                                }
                              } catch {}
                              return (
                                <li key={idx} className="font-medium">
                                  {display}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="font-medium text-gray-400">No upcoming slots</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Max Patients per Slot</p>
                        <p className="font-medium">{profileMaxPatients}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  variants={staggeredItemVariants}
                  className="bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-100 mb-5">
                    Account Settings
                  </h3>
                  <Link to="/doc-settings">
                    <Button variant="primary" size="sm">
                      <SettingsIcon className="mr-2 w-4 h-4" /> Go to Settings
                    </Button>
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {profileError && (
          <div className="mt-4 bg-red-600 text-white p-3 rounded">{profileError}</div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardPage;

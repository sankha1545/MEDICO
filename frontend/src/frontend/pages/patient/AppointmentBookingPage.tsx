import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, Info } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FadeIn, SlideIn } from '../../components/animations/Transitions';

// Mock data for doctors (similar to DoctorsPage)
const mockDoctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviewCount: 124,
    experience: '15 years',
    hospitalAffiliation: 'Memorial Hospital',
    location: 'New York, NY',
    image: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '2',
    name: 'Dr. Michael Rodriguez',
    specialty: 'Dermatologist',
    rating: 4.7,
    reviewCount: 98,
    experience: '12 years',
    hospitalAffiliation: 'City Medical Center',
    location: 'New York, NY',
    image: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '3',
    name: 'Dr. Emma Chen',
    specialty: 'Neurologist',
    rating: 4.8,
    reviewCount: 112,
    experience: '10 years',
    hospitalAffiliation: 'University Hospital',
    location: 'New York, NY',
    image: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

// Mock data for available time slots
const mockTimeSlots = [
  { id: '1', time: '9:00 AM', available: true },
  { id: '2', time: '9:30 AM', available: false },
  { id: '3', time: '10:00 AM', available: true },
  { id: '4', time: '10:30 AM', available: true },
  { id: '5', time: '11:00 AM', available: true },
  { id: '6', time: '11:30 AM', available: false },
  { id: '7', time: '1:00 PM', available: true },
  { id: '8', time: '1:30 PM', available: true },
  { id: '9', time: '2:00 PM', available: false },
  { id: '10', time: '2:30 PM', available: false },
  { id: '11', time: '3:00 PM', available: true },
  { id: '12', time: '3:30 PM', available: true },
  { id: '13', time: '4:00 PM', available: true },
  { id: '14', time: '4:30 PM', available: false }
];

const AppointmentBookingPage = () => {
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get('doctor');
  const navigate = useNavigate();
  
  // Step state (1: select doctor, 2: select date/time, 3: confirm details)
  const [currentStep, setCurrentStep] = useState(initialDoctorId ? 2 : 1);
  
  // Selection states
  const [selectedDoctor, setSelectedDoctor] = useState(
    initialDoctorId ? mockDoctors.find(d => d.id === initialDoctorId) || null : null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    // Default to tomorrow
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video'>('in-person');
  const [reason, setReason] = useState('');
  
  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Move to next step
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  // Move to previous step
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Handle booking completion
  const handleBookAppointment = () => {
    // In a real app, this would make an API call to book the appointment
    // Simulate a successful booking and navigate to a confirmation page
    navigate('/dashboard');
  };
  
  // Generate calendar days for the current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // Number of days in the month
    const daysInMonth = lastDay.getDate();
    
    // Array to hold all calendar days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Disable past dates
      const isDisabled = date < new Date(new Date().setHours(0, 0, 0, 0));
      days.push({ date, isDisabled });
    }
    
    return days;
  };
  
  // Calendar days for the current month
  const calendarDays = generateCalendarDays();
  
  // Move to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Move to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Book an Appointment</h1>
          <p className="text-gray-600">
            Schedule an appointment with a top healthcare provider in just a few steps.
          </p>
        </div>
      </FadeIn>
      
      {/* Progress indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {['Select Doctor', 'Choose Date & Time', 'Confirm Details'].map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep > index + 1 
                    ? 'bg-primary-500 text-white' 
                    : currentStep === index + 1 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                }`}
              >
                {currentStep > index + 1 ? (
                  <Check size={20} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-sm ${
                currentStep >= index + 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 relative">
          <div className="h-1 bg-gray-200 rounded-full"></div>
          <div 
            className="absolute top-0 left-0 h-1 bg-primary-500 rounded-full transition-all"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Step 1: Select Doctor */}
      {currentStep === 1 && (
        <SlideIn>
          <div className="bg-white rounded-xl shadow-subtle border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select a Doctor</h2>
            
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search by name or specialty..."
                icon={<Search size={16} />}
                fullWidth
              />
            </div>
            
            <div className="space-y-4">
              {mockDoctors.map((doctor) => (
                <div 
                  key={doctor.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedDoctor?.id === doctor.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="flex items-center">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover mr-4" 
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{doctor.name}</h3>
                      <p className="text-primary-600">{doctor.specialty}</p>
                      <p className="text-sm text-gray-500">{doctor.hospitalAffiliation}</p>
                    </div>
                    <div>
                      {selectedDoctor?.id === doctor.id && (
                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button 
                variant="primary" 
                onClick={nextStep}
                disabled={!selectedDoctor}
              >
                Next: Choose Date & Time
              </Button>
            </div>
          </div>
        </SlideIn>
      )}
      
      {/* Step 2: Select Date & Time */}
      {currentStep === 2 && (
        <SlideIn>
          <div className="bg-white rounded-xl shadow-subtle border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Choose Date & Time</h2>
              
              {selectedDoctor && (
                <div className="flex items-center">
                  <img 
                    src={selectedDoctor.image} 
                    alt={selectedDoctor.name}
                    className="w-8 h-8 rounded-full object-cover mr-2" 
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedDoctor.name}</p>
                    <p className="text-xs text-gray-500">{selectedDoctor.specialty}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Select Date</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={prevMonth}
                      className="p-1 rounded-full hover:bg-gray-100"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      onClick={nextMonth}
                      className="p-1 rounded-full hover:bg-gray-100"
                      aria-label="Next month"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="font-medium text-lg text-gray-900">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => (
                    <div key={i} className="p-1">
                      {day ? (
                        <button
                          className={`w-full h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
                            day.isDisabled 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : selectedDate && day.date.toDateString() === selectedDate.toDateString() 
                                ? 'bg-primary-500 text-white font-medium'
                                : 'hover:bg-gray-100 text-gray-700'
                          }`}
                          onClick={() => !day.isDisabled && setSelectedDate(day.date)}
                          disabled={day.isDisabled}
                          type="button"
                        >
                          {day.date.getDate()}
                        </button>
                      ) : (
                        <div className="w-full h-10"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Time slots */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Select Time</h3>
                
                {selectedDate ? (
                  <>
                    <p className="text-sm text-gray-500 mb-4">
                      Available time slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {mockTimeSlots.map((slot) => (
                        <button
                          key={slot.id}
                          className={`py-2 px-4 border rounded-md text-sm transition-colors ${
                            !slot.available 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : selectedTimeSlot === slot.id
                                ? 'bg-primary-50 text-primary-700 border-primary-500'
                                : 'hover:bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                          onClick={() => slot.available && setSelectedTimeSlot(slot.id)}
                          disabled={!slot.available}
                        >
                          <div className="flex items-center justify-between">
                            <span>{slot.time}</span>
                            {selectedTimeSlot === slot.id && (
                              <Check size={16} className="text-primary-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Please select a date first</p>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Appointment Type</h3>
                  <div className="flex space-x-4">
                    <button
                      className={`flex-1 py-3 px-4 border rounded-md transition-colors ${
                        appointmentType === 'in-person'
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setAppointmentType('in-person')}
                    >
                      <div className="flex flex-col items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 22v-2.5a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5V22" />
                          <path d="M7 10v2a6 6 0 0 0 12 0v-2" />
                          <path d="M12 16a2 2 0 0 1-2-2" />
                          <path d="M14 16a2 2 0 0 0 2-2" />
                          <path d="M17 16h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2" />
                          <path d="M7 16H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" />
                          <path d="M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                        </svg>
                        <span className="mt-1 text-sm">In-Person</span>
                      </div>
                    </button>
                    <button
                      className={`flex-1 py-3 px-4 border rounded-md transition-colors ${
                        appointmentType === 'video'
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setAppointmentType('video')}
                    >
                      <div className="flex flex-col items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <span className="mt-1 text-sm">Video Call</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={nextStep}
                disabled={!selectedDate || !selectedTimeSlot}
              >
                Next: Confirm Details
              </Button>
            </div>
          </div>
        </SlideIn>
      )}
      
      {/* Step 3: Confirm Details */}
      {currentStep === 3 && (
        <SlideIn>
          <div className="bg-white rounded-xl shadow-subtle border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirm Appointment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="bg-gray-50 rounded-lg p-5 mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Appointment Summary</h3>
                  
                  {selectedDoctor && (
                    <div className="flex items-center mb-4">
                      <img 
                        src={selectedDoctor.image} 
                        alt={selectedDoctor.name}
                        className="w-12 h-12 rounded-full object-cover mr-3" 
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
                        <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar size={18} className="text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Date not selected'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={18} className="text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        {selectedTimeSlot ? 
                          mockTimeSlots.find(slot => slot.id === selectedTimeSlot)?.time : 
                          'Time not selected'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-2">
                        {appointmentType === 'in-person' ? (
                          <>
                            <path d="M3 22v-2.5a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5V22" />
                            <path d="M7 10v2a6 6 0 0 0 12 0v-2" />
                            <path d="M12 16a2 2 0 0 1-2-2" />
                            <path d="M14 16a2 2 0 0 0 2-2" />
                            <path d="M17 16h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2" />
                            <path d="M7 16H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" />
                            <path d="M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                          </>
                        ) : (
                          <>
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </>
                        )}
                      </svg>
                      <span className="text-gray-700">
                        {appointmentType === 'in-person' ? 'In-Person Visit' : 'Video Consultation'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Visit
                  </label>
                  <textarea
                    rows={5}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-3"
                    placeholder="Please describe your symptoms or reason for the appointment..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              
              <div>
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-5 mb-6">
                  <div className="flex items-start">
                    <Info size={18} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-primary-800 mb-2">Important Information</h3>
                      <ul className="text-sm text-primary-700 space-y-2">
                        <li>• Please arrive 15 minutes before your appointment time.</li>
                        <li>• Bring your ID and insurance card.</li>
                        <li>• Wear a mask for in-person visits.</li>
                        <li>• You can cancel or reschedule up to 24 hours before your appointment.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-medium text-gray-900 mb-4">Payment Information</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your insurance information will be used for this appointment. Co-pay will be collected at the time of service.
                  </p>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Estimated co-pay:</span>
                      <span className="font-medium text-gray-900">$25.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Insurance:</span>
                      <span className="font-medium text-gray-900">Blue Cross Blue Shield</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex items-center mb-4">
                    <input
                      id="consent"
                      name="consent"
                      type="checkbox"
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="consent" className="ml-2 block text-sm text-gray-700">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                        terms and conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                        privacy policy
                      </Link>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBookAppointment}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </SlideIn>
      )}
    </div>
  );
};

export default AppointmentBookingPage;
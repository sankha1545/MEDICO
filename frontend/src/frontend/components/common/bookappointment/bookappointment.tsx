import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import axios from 'axios';

const Bookappointment = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const token = localStorage.getItem('authToken');
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/appointments',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/')
        .then(res => {
          if (res.data) setFormData(res.data);
        })
        .catch(err => console.error('Fetch failed:', err));
    }
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/', formData)
      .then(() => {
        console.log('Appointment saved');
        setIsOpen(false);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to save appointment');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Book Appointment
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-4">Book an Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {['name', 'phone', 'email', 'address'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)} {field !== 'email' && <span className="text-red-500">*</span>}
                  </label>
                  {field !== 'address' ? (
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      name={field}
                      value={(formData as any)[field]}
                      onChange={handleChange}
                      required={field !== 'email'}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="w-full py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookappointment;

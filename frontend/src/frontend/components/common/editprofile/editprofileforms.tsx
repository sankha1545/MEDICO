import React, { useState } from 'react';
import { Button } from '../Button';

export default function EditProfileForm({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');

  const handleSubmit = e => {
    e.preventDefault();
    onSave({ name, email, phone, dob });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        <label className="block mb-2">
          <span className="text-sm text-gray-600">Full Name</span>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </label>
        <label className="block mb-2">
          <span className="text-sm text-gray-600">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </label>
        <label className="block mb-2">
          <span className="text-sm text-gray-600">Phone Number</span>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-gray-600">Date of Birth</span>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
        </label>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
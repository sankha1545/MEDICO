import React, { useState, FormEvent } from 'react';
import { Button } from './Button';

interface MedicalInfo {
  bloodType: string;
  allergies: string;
  currentMedications: string;
  medicalConditions: string;
}

interface UpdateMedicalInfoFormProps {
  medicalInfo: MedicalInfo;
  onClose: () => void;
  onSave: (info: MedicalInfo) => void;
}

const UpdateMedicalInfoForm: React.FC<UpdateMedicalInfoFormProps> = ({
  medicalInfo,
  onClose,
  onSave,
}) => {
  const [bloodType, setBloodType] = useState(medicalInfo.bloodType);
  const [allergies, setAllergies] = useState(medicalInfo.allergies);
  const [currentMedications, setCurrentMedications] = useState(medicalInfo.currentMedications);
  const [medicalConditions, setMedicalConditions] = useState(medicalInfo.medicalConditions);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      bloodType,
      allergies,
      currentMedications,
      medicalConditions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4">Update Medical Info</h2>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Blood Type</span>
          <input
            type="text"
            value={bloodType}
            onChange={e => setBloodType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Allergies</span>
          <input
            type="text"
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Current Medications</span>
          <input
            type="text"
            value={currentMedications}
            onChange={e => setCurrentMedications(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-gray-600">Medical Conditions</span>
          <input
            type="text"
            value={medicalConditions}
            onChange={e => setMedicalConditions(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </label>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateMedicalInfoForm;

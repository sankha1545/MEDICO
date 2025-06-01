import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: String,
  phone: String,
  email: String,
  address: String,
});

export default mongoose.model('Appointment', appointmentSchema);

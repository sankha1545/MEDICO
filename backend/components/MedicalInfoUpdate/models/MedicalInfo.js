const mongoose = require("mongoose");

const MedicalInfoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  bloodType: { type: String, default: "", trim: true },
  allergies: { type: String, default: "", trim: true },
  currentMedications: { type: String, default: "", trim: true },
  medicalConditions: { type: String, default: "", trim: true },
}, { timestamps: true });

module.exports = mongoose.model("MedicalInfo", MedicalInfoSchema);

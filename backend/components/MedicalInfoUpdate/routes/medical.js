const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const MedicalInfo = require("../models/MedicalInfo");

// GET /api/medical   → returns existing or blank medical info
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const doc = await MedicalInfo.findOne({ user: userId });
    if (!doc) {
      return res.status(200).json({
        medicalInfo: {
          bloodType: "",
          allergies: "",
          currentMedications: "",
          medicalConditions: "",
        },
      });
    }
    return res.status(200).json({ medicalInfo: doc });
  } catch (err) {
    console.error("GET /api/medical error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/medical   → create or update medical info
router.put("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    bloodType = "",
    allergies = "",
    currentMedications = "",
    medicalConditions = "",
  } = req.body;
  try {
    let doc = await MedicalInfo.findOne({ user: userId });
    if (!doc) {
      doc = new MedicalInfo({
        user: userId,
        bloodType,
        allergies,
        currentMedications,
        medicalConditions,
      });
    } else {
      doc.bloodType = bloodType;
      doc.allergies = allergies;
      doc.currentMedications = currentMedications;
      doc.medicalConditions = medicalConditions;
    }
    const saved = await doc.save();
    return res.status(200).json({ medicalInfo: saved });
  } catch (err) {
    console.error("PUT /api/medical error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;

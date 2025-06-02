// backend/src/controllers/authController.js

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // 1) Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all fields." });
  }

  try {
    // 2) Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // 3) Create new user document
    const newUser = new User({ name, email, password });
    // pre-save hook on User schema will hash the password
    await newUser.save();

    // 4) Generate JWT
    const payload = { userId: newUser._id.toString() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Error in authController.register:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1) Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide all fields." });
  }

  try {
    // 2) Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // 3) Compare submitted password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // 4) Generate JWT
    const payload = { userId: user._id.toString() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Error in authController.login:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

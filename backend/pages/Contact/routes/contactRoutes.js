// File: src/routes/contactRoutes.js

const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');

// Handles POST   /api/contact   AND   /contact/api
router.post('/', submitContactForm);

module.exports = router;

const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');

// POST route for handling form submissions
router.post('/', submitContactForm);

module.exports = router;

const Contact = require('../models/Contact');

// Controller to handle contact form submissions
const submitContactForm = async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    // Create a new contact document
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
    });

    // Save it to the database
    await newContact.save();
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};

module.exports = { submitContactForm };

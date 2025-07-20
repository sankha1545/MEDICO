const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

// Set up the Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail's SMTP service
  auth: {
    user: process.env.EMAIL_USER, // Your email address (from .env)
    pass: process.env.EMAIL_PASS, // Your email password (from .env, ideally use an app password for Gmail)
  },
});

// Controller to handle contact form submissions
const submitContactForm = async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    // Create a new contact document for the database
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
    });

    // Save it to the database
    await newContact.save();

    // Send email notification to the organization
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email address (use your organization's email)
      to: 'medicox270@gmail.com', // Recipient's email address (your organization's email)
      subject: 'New Contact Form Submission', // Subject of the email
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `, // HTML content to display the contact form data in the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Send a success response back to the client
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};

module.exports = { submitContactForm };

// emailOtpRoutes.js
import express from 'express'
import nodemailer from 'nodemailer'

const router = express.Router()
const otpStore = new Map()

// Build transporter once; if creds are missing this will throw here
let transporter
try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
} catch (err) {
  console.error('Failed to create transporter:', err)
  // You could even process.exit(1) here in a real app
}

// 1) Send/resend OTP
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email required' })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 5 * 60 * 1000
    otpStore.set(email, { otp, expires })

    // Attempt to send
    await transporter.sendMail({
      from: '"MedBook" <noreply@medbook.com>',
      to: email,
      subject: 'Your MedBook verification code',
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    })

    return res.json({ message: 'OTP sent' })
  } catch (err) {
    console.error('Error in /send-email-otp:', err)
    return res.status(500).json({ message: 'Unable to send OTP', error: err.message })
  }
})

// 2) Verify OTP
router.post('/verify-email-otp', (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' })
    }

    const record = otpStore.get(email)
    if (!record) {
      return res.status(400).json({ message: 'No OTP found' })
    }
    if (Date.now() > record.expires) {
      otpStore.delete(email)
      return res.status(410).json({ message: 'OTP expired' })
    }
    if (record.otp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' })
    }

    otpStore.delete(email)
    return res.json({ message: 'OTP verified' })
  } catch (err) {
    console.error('Error in /verify-email-otp:', err)
    return res.status(500).json({ message: 'Unable to verify OTP', error: err.message })
  }
})

export default router

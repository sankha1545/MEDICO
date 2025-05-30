import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import emailOtpRoutes from './emailOtpRoutes.js'

dotenv.config()

const app = express()

// allow your React origin:
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())
app.use('/api', emailOtpRoutes)

app.listen(process.env.PORT || 4000, () =>
  console.log(`API listening on port ${process.env.PORT || 4000}`)
)

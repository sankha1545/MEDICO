# MedicoX 🩺

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Frontend Build Status](https://img.shields.io/badge/Frontend-passing-brightgreen)]  
[![Backend Build Status](https://img.shields.io/badge/Backend-passing-brightgreen)]  
[![Docker Compose](https://img.shields.io/badge/Docker–Compose-blue)]  
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)]  
[![React](https://img.shields.io/badge/React-18.x-blue)]  

A full-stack, Dockerized **doctor-appointment booking** and **tele-medicine** platform, built with modern technologies to streamline patient–doctor interactions, billing, chat support, and notifications.

---

## 🚀 Features

- **User Authentication & Authorization**  
  - Local email/password signup + login  
  - Google OAuth 2.0 via Passport.js  
  - JWT-based session management  
- **Doctor & Patient Profiles**  
  - Complete profile CRUD  
  - Profile image upload & retrieval (stored in MongoDB)  
  - Availability slot management  
- **Appointment Booking & Management**  
  - Real-time slot fetching per doctor  
  - Consultation fee display  
  - Razorpay integration for secure payment  
- **OTP-Based Password Recovery**  
  - Email-delivered OTP via Nodemailer  
  - Configurable expiry  
- **Notifications & Chatbot**  
  - In-app notifications (appointments, reminders)  
  - Contact & chatbot microservices  
- **DevOps & Deployment**  
  - Dockerized microservices (auth, chatbot, contact) + frontend  
  - Single `docker-compose.yml` orchestration  
  - HTTPS with Let’s Encrypt / Certbot on Nginx  
  - Deployed on AWS EC2 (backend) & Netlify/Vercel (frontend)  
- **Tech-stack Highlights**  
  - **Backend:** Node.js, TypeScript, Express, Mongoose, Passport, Firebase, Razorpay, Nodemailer  
  - **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, react-hook-form  
  - **Database:** MongoDB Atlas  
  - **CI/CD:** (Coming soon) GitHub Actions + Docker Hub  

---

## 📁 Repository Structure

.
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── App.tsx
│ │ └── vite.config.ts
│ ├── .env
│ ├── package.json
│ └── tailwind.config.js
├── backend/
│ ├── src/
│ │ ├── models/
│ │ ├── routes/
│ │ │ ├── auth.ts
│ │ │ ├── appointments.ts
│ │ │ ├── doctors.ts
│ │ │ └── payments.ts
│ │ ├── utils/
│ │ └── index.ts
│ ├── .env
│ ├── dockerfile
│ └── package.json
├── docker-compose.yml
├── nginx/
│ └── default.conf
├── .gitignore
└── README.md



---

## 🔧 Installation & Setup

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-username/MedicoX.git
   cd MedicoX
Environment Variables

Copy and configure .env.example in both frontend/ and backend/

Required keys:

VITE_API_URL, VITE_GOOGLE_CLIENT_ID (frontend)

PORT, MONGO_URI, JWT_SECRET, Google OAuth, Razorpay, SMTP credentials (backend)

Local Docker Deployment


docker compose up --build -d
Backend at http://localhost:4000/api

Frontend at http://localhost:5173

Manual Setup (without Docker)

Backend


cd backend
npm install
npm run dev
Frontend


cd frontend
npm install
npm run dev
🌐 API Endpoints
Module	Endpoint	Method	Description
Auth	/api/auth/signup	POST	User registration
/api/auth/login	POST	User login
/api/auth/google	GET	Google OAuth callback
Doctors	/api/doctors/me	GET/PUT	Fetch & update doctor’s profile
Appointments	/api/appointments/slots/:docId	GET	Fetch doctor’s available slots
/api/appointments/book	POST	Book an appointment
Payments	/api/payments/order	POST	Create Razorpay order
Notifications	/api/notifications	GET	Retrieve user notifications

For full list, see backend/src/routes.

⚙️ Deployment
SSL & Nginx

Use Certbot to issue TLS certificates

Example:


sudo certbot --nginx -d api.yourdomain.com
AWS EC2

Spin up an Ubuntu instance

Install Docker & Docker Compose

Clone repo, configure env, run docker compose up -d

Frontend Hosting

Connect GitHub repo to Netlify/Vercel

Set build command: npm run build

Publish the dist/ directory

👥 Contributing
Fork the project

Create your feature branch


git checkout -b feature/fooBar
Commit your changes


git commit -m "feat: add fooBar"
Push to the branch


git push origin feature/fooBar
Open a Pull Request

Please follow our Code of Conduct and Contributing Guide.

📄 License
Distributed under the MIT License. See LICENSE for more information.

📞 Contact
Project Lead: Akash Dass

Email: akash@example.com

GitHub: akash-dass

“Healing is a matter of time, but it is sometimes also a matter of opportunity.” – Hippocrates

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
```
.
├── README.md
├── backend
│   ├── auth
│   │   ├── dist
│   │   │   ├── index.js
│   │   │   ├── models
│   │   │   │   ├── Appointment.js
│   │   │   │   ├── Doctor.js
│   │   │   │   ├── MedicalInfo.js
│   │   │   │   ├── Notification.js
│   │   │   │   ├── Otp.js
│   │   │   │   ├── Patient.js
│   │   │   │   ├── Payment.js
│   │   │   │   ├── ProfileImage.js
│   │   │   │   └── wallet.js
│   │   │   ├── routes
│   │   │   │   ├── Doctor.js
│   │   │   │   ├── Webhook.js
│   │   │   │   ├── appointment.js
│   │   │   │   ├── auth.js
│   │   │   │   ├── doc-medical.js
│   │   │   │   ├── medical.js
│   │   │   │   ├── medicalinfo.js
│   │   │   │   ├── notifications.js
│   │   │   │   ├── payment.js
│   │   │   │   └── profile.js
│   │   │   ├── types
│   │   │   │   └── AuthRequest.js
│   │   │   └── utils
│   │   │       ├── auth.js
│   │   │       ├── email.js
│   │   │       ├── generatePrescriptionPdf.js
│   │   │       ├── notificationsScheduler.js
│   │   │       ├── razorpayClient.js
│   │   │       ├── sendMail.js
│   │   │       └── sendSMSViaEmail.js
│   │   ├── dockerfile
│   │   ├── public
│   │   │   └── prescriptions
│   │   │       ├── prescription_6871571f8b636c88f22192b8_1752314264471.pdf
│   │   │       ├── prescription_6871571f8b636c88f22192b8_1752314960317.pdf
│   │   │       ├── prescription_6871571f8b636c88f22192b8_1752315274291.pdf
│   │   │       ├── prescription_6871571f8b636c88f22192b8_1752319841707.pdf
│   │   │       ├── prescription_6871571f8b636c88f22192b8_1752319847361.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752320010459.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752320145402.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752320392711.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752320458174.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752324439743.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752324774771.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752325282784.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752325756136.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752326868310.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752327008734.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752327281588.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752327647194.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752327733663.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752327788642.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752387697252.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752388021506.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752391119350.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752398550797.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752399138836.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752399215301.pdf
│   │   │       ├── prescription_687241c935d15d75a2841074_1752564867137.pdf
│   │   │       ├── prescription_68754fb61ac4d456a43059ef_1752518775881.pdf
│   │   │       └── prescription_687e0ca4d6459e005d9cf649_1753091510592.pdf
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── models
│   │   │   │   ├── Appointment.ts
│   │   │   │   ├── Doctor.ts
│   │   │   │   ├── MedicalInfo.ts
│   │   │   │   ├── Notification.ts
│   │   │   │   ├── Otp.ts
│   │   │   │   ├── Patient.ts
│   │   │   │   ├── Payment.ts
│   │   │   │   ├── ProfileImage.ts
│   │   │   │   └── wallet.ts
│   │   │   ├── routes
│   │   │   │   ├── Doctor.ts
│   │   │   │   ├── Webhook.ts
│   │   │   │   ├── appointment.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── doc-medical.ts
│   │   │   │   ├── medical.ts
│   │   │   │   ├── medicalinfo.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── payment.ts
│   │   │   │   └── profile.ts
│   │   │   ├── types
│   │   │   │   ├── AuthRequest.ts
│   │   │   │   ├── env.d.ts
│   │   │   │   └── express
│   │   │   └── utils
│   │   │       ├── auth.ts
│   │   │       ├── email.ts
│   │   │       ├── generatePrescriptionPdf.ts
│   │   │       ├── notificationsScheduler.ts
│   │   │       ├── razorpayClient.ts
│   │   │       ├── sendMail.ts
│   │   │       └── sendSMSViaEmail.ts
│   │   └── tsconfig.json
│   ├── components
│   │   └── chatbot
│   │       ├── data
│   │       │   └── qa.json
│   │       ├── dockerfile
│   │       └── src
│   │           ├── config.js
│   │           ├── jsonparser.js
│   │           ├── qaStore.js
│   │           ├── routes
│   │           │   └── chat.js
│   │           └── server.js
│   └── pages
│       └── Contact
│           ├── ContactSubmission.js
│           ├── config
│           │   └── db.js
│           ├── controllers
│           │   └── contactController.js
│           ├── dockerfile
│           ├── models
│           │   └── Contact.js
│           ├── routes
│           │   └── contactRoutes.js
│           └── server.js
├── backup
│   └── medbook
│       ├── appointments.bson
│       ├── appointments.metadata.json
│       ├── doctors.bson
│       ├── doctors.metadata.json
│       ├── medicalinfos.bson
│       ├── medicalinfos.metadata.json
│       ├── notifications.bson
│       ├── notifications.metadata.json
│       ├── otps.bson
│       ├── otps.metadata.json
│       ├── patients.bson
│       ├── patients.metadata.json
│       ├── payments.bson
│       ├── payments.metadata.json
│       ├── prelude.json
│       ├── wallets.bson
│       └── wallets.metadata.json
├── docker-compose.yml
└── frontend
    ├── Dockerfile
    ├── build
    │   ├── assets
    │   │   ├── Logo-Dk87Km2m.png
    │   │   ├── MedicoX_Your_Health_Simplified_free.mp4_1750278640502-CBGVefPA.mp4
    │   │   ├── bot-BG79grlu.png
    │   │   ├── chair-CHcKt4X3.avif
    │   │   ├── earth-CU6MTsIu.png
    │   │   ├── html2canvas.esm-CBrSDip1.js
    │   │   ├── index-CclflMbx.css
    │   │   ├── index-Skik9wlv.js
    │   │   ├── index.es-DnHaPodH.js
    │   │   ├── inter-cyrillic-400-normal-BLGc9T1a.woff2
    │   │   ├── inter-cyrillic-400-normal-alAqRL36.woff
    │   │   ├── inter-cyrillic-700-normal-bGtGjVdZ.woff2
    │   │   ├── inter-cyrillic-700-normal-oWiwobpV.woff
    │   │   ├── inter-cyrillic-ext-400-normal-BE2fNs0E.woff
    │   │   ├── inter-cyrillic-ext-400-normal-Dc4VJyIJ.woff2
    │   │   ├── inter-cyrillic-ext-700-normal-Cg0zx2i8.woff
    │   │   ├── inter-cyrillic-ext-700-normal-ClVoMEGq.woff2
    │   │   ├── inter-greek-400-normal-C3I71FoW.woff
    │   │   ├── inter-greek-400-normal-DxZsaF_h.woff2
    │   │   ├── inter-greek-700-normal-Cxpycf-U.woff2
    │   │   ├── inter-greek-700-normal-DtGkhywV.woff
    │   │   ├── inter-greek-ext-400-normal-Bput3-QP.woff2
    │   │   ├── inter-greek-ext-400-normal-XIH6-K3k.woff
    │   │   ├── inter-greek-ext-700-normal-D0KHSs-V.woff
    │   │   ├── inter-greek-ext-700-normal-SzCdnevJ.woff2
    │   │   ├── inter-latin-400-normal-C38fXH4l.woff2
    │   │   ├── inter-latin-400-normal-CyCys3Eg.woff
    │   │   ├── inter-latin-700-normal-Drs_5D37.woff2
    │   │   ├── inter-latin-700-normal-KTwiWvO9.woff
    │   │   ├── inter-latin-ext-400-normal-77YHD8bZ.woff
    │   │   ├── inter-latin-ext-400-normal-C1nco2VV.woff2
    │   │   ├── inter-latin-ext-700-normal-CfWAu3Qq.woff2
    │   │   ├── inter-latin-ext-700-normal-Z3s-4e5M.woff
    │   │   ├── inter-vietnamese-400-normal-Bbgyi5SW.woff
    │   │   ├── inter-vietnamese-400-normal-DMkecbls.woff2
    │   │   ├── inter-vietnamese-700-normal-CGpBpxLq.woff2
    │   │   ├── inter-vietnamese-700-normal-DL6eWghQ.woff
    │   │   ├── purify.es-C_uT9hQ1.js
    │   │   └── user-aYidAGiN.png
    │   ├── fonts
    │   │   └── Inter-Bold.woff
    │   └── index.html
    ├── dist
    │   ├── assets
    │   │   ├── Logo-Dk87Km2m.png
    │   │   ├── MedicoX_Your_Health_Simplified_free.mp4_1750278640502-CBGVefPA.mp4
    │   │   ├── bot-BG79grlu.png
    │   │   ├── chair-CHcKt4X3.avif
    │   │   ├── cloud-DlLsTpNk.png
    │   │   ├── earth-CU6MTsIu.png
    │   │   ├── html2canvas.esm-CBrSDip1.js
    │   │   ├── index-BH4S6wKN.js
    │   │   ├── index-HYcv-1QW.css
    │   │   ├── index.es-BIdoTvDi.js
    │   │   ├── inter-cyrillic-400-normal-BLGc9T1a.woff2
    │   │   ├── inter-cyrillic-400-normal-alAqRL36.woff
    │   │   ├── inter-cyrillic-700-normal-bGtGjVdZ.woff2
    │   │   ├── inter-cyrillic-700-normal-oWiwobpV.woff
    │   │   ├── inter-cyrillic-ext-400-normal-BE2fNs0E.woff
    │   │   ├── inter-cyrillic-ext-400-normal-Dc4VJyIJ.woff2
    │   │   ├── inter-cyrillic-ext-700-normal-Cg0zx2i8.woff
    │   │   ├── inter-cyrillic-ext-700-normal-ClVoMEGq.woff2
    │   │   ├── inter-greek-400-normal-C3I71FoW.woff
    │   │   ├── inter-greek-400-normal-DxZsaF_h.woff2
    │   │   ├── inter-greek-700-normal-Cxpycf-U.woff2
    │   │   ├── inter-greek-700-normal-DtGkhywV.woff
    │   │   ├── inter-greek-ext-400-normal-Bput3-QP.woff2
    │   │   ├── inter-greek-ext-400-normal-XIH6-K3k.woff
    │   │   ├── inter-greek-ext-700-normal-D0KHSs-V.woff
    │   │   ├── inter-greek-ext-700-normal-SzCdnevJ.woff2
    │   │   ├── inter-latin-400-normal-C38fXH4l.woff2
    │   │   ├── inter-latin-400-normal-CyCys3Eg.woff
    │   │   ├── inter-latin-700-normal-Drs_5D37.woff2
    │   │   ├── inter-latin-700-normal-KTwiWvO9.woff
    │   │   ├── inter-latin-ext-400-normal-77YHD8bZ.woff
    │   │   ├── inter-latin-ext-400-normal-C1nco2VV.woff2
    │   │   ├── inter-latin-ext-700-normal-CfWAu3Qq.woff2
    │   │   ├── inter-latin-ext-700-normal-Z3s-4e5M.woff
    │   │   ├── inter-vietnamese-400-normal-Bbgyi5SW.woff
    │   │   ├── inter-vietnamese-400-normal-DMkecbls.woff2
    │   │   ├── inter-vietnamese-700-normal-CGpBpxLq.woff2
    │   │   ├── inter-vietnamese-700-normal-DL6eWghQ.woff
    │   │   ├── purify.es-C_uT9hQ1.js
    │   │   └── user-aYidAGiN.png
    │   ├── fonts
    │   │   └── Inter-Bold.woff
    │   └── index.html
    ├── eslint.config.js
    ├── index.html
    ├── nginx.conf
    ├── postcss.config.js
    ├── public
    │   └── fonts
    │       └── Inter-Bold.woff
    ├── src
    │   ├── App.tsx
    │   ├── contexts
    │   │   ├── AuthContext.tsx
    │   │   └── ToastContext.tsx
    │   ├── env.d.ts
    │   ├── frontend
    │   │   ├── API
    │   │   │   └── chatbot.ts
    │   │   ├── Auth
    │   │   │   ├── Forgotpasswordpage.tsx
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── ResetOtpPage.tsx
    │   │   │   ├── ResetpassowrdPage.tsx
    │   │   │   ├── SignupPage.tsx
    │   │   │   ├── VerifyEmailOtp.tsx
    │   │   │   └── styles
    │   │   │       └── 3dBackground.css
    │   │   ├── assets
    │   │   │   ├── Cardiology.jpg
    │   │   │   ├── Dental.jpg
    │   │   │   ├── Dermatology.jpg
    │   │   │   ├── Logo.png
    │   │   │   ├── MedicoX_Your_Health_Simplified_free.mp4_1750278640502.mp4
    │   │   │   ├── bot.png
    │   │   │   ├── chair.avif
    │   │   │   ├── cloud.png
    │   │   │   ├── company  (1).svg
    │   │   │   ├── company  (10).svg
    │   │   │   ├── company  (2).svg
    │   │   │   ├── company  (3).svg
    │   │   │   ├── company  (4).svg
    │   │   │   ├── company  (5).svg
    │   │   │   ├── company  (6).svg
    │   │   │   ├── company  (7).svg
    │   │   │   ├── company  (8).svg
    │   │   │   ├── company  (9).svg
    │   │   │   ├── doctorseat.png
    │   │   │   ├── earth-Photoroom.png
    │   │   │   ├── earth.png
    │   │   │   ├── earth2.jpeg
    │   │   │   ├── earth3 (1).png
    │   │   │   ├── earth3 (2).png
    │   │   │   ├── earth3 (3).png
    │   │   │   ├── general_consultation.jpg
    │   │   │   ├── google.png
    │   │   │   ├── medico-intro.json
    │   │   │   ├── patient.jpg
    │   │   │   ├── pediatrician.jpg
    │   │   │   ├── telehealth.jpg
    │   │   │   └── user.png
    │   │   ├── components
    │   │   │   ├── Loading
    │   │   │   │   └── Loading.tsx
    │   │   │   ├── PayoutSetupForm.tsx
    │   │   │   ├── ProjectGlimpse.tsx
    │   │   │   ├── animations
    │   │   │   │   ├── 3D
    │   │   │   │   │   ├── AnimatedCard.tsx
    │   │   │   │   │   ├── Animatedinput.tsx
    │   │   │   │   │   ├── Animatedtoggle.tsx
    │   │   │   │   │   ├── Background3D.tsx
    │   │   │   │   │   ├── DNAHelix.tsx
    │   │   │   │   │   ├── FloatingElements.tsx
    │   │   │   │   │   ├── FloatingMedicalElements.tsx
    │   │   │   │   │   ├── FloatingMedicalIcons.tsx
    │   │   │   │   │   └── MedicalParticles.tsx
    │   │   │   │   ├── BackGroundAnimations.tsx
    │   │   │   │   ├── ChakraTransition.tsx
    │   │   │   │   ├── GlowingText.tsx
    │   │   │   │   ├── ParticleField.tsx
    │   │   │   │   ├── Transitions.tsx
    │   │   │   │   └── doctor
    │   │   │   │       ├── AnimatedChart.tsx
    │   │   │   │       ├── Dashboard.tsx
    │   │   │   │       ├── FloatingNavbar.tsx
    │   │   │   │       ├── ProfileAvatar3D.tsx
    │   │   │   │       ├── StatsCard.tsx
    │   │   │   │       └── ThreeBackground.tsx
    │   │   │   ├── common
    │   │   │   │   ├── AnimatedButton.tsx
    │   │   │   │   ├── Button.tsx
    │   │   │   │   ├── Card.tsx
    │   │   │   │   ├── Input.tsx
    │   │   │   │   ├── SettingsDocumentation.tsx
    │   │   │   │   ├── Tooltip.tsx
    │   │   │   │   ├── Tutorial
    │   │   │   │   │   ├── GuidedTour.tsx
    │   │   │   │   │   ├── TutorialManager.tsx
    │   │   │   │   │   └── Welcometutorial.tsx
    │   │   │   │   ├── bookappointment
    │   │   │   │   │   └── bookappointment.tsx
    │   │   │   │   ├── chatbot
    │   │   │   │   │   ├── Message.tsx
    │   │   │   │   │   ├── TypingIndicator.tsx
    │   │   │   │   │   └── chatbot.tsx
    │   │   │   │   ├── cursor.tsx
    │   │   │   │   ├── editprofile
    │   │   │   │   │   ├── editprofileforms.tsx
    │   │   │   │   │   └── editprofileformsdoc.tsx
    │   │   │   │   ├── medicalinfo
    │   │   │   │   │   └── UpdateMedicalInfoForm.tsx
    │   │   │   │   ├── profile.tsx
    │   │   │   │   ├── settingsdoc.tsx
    │   │   │   │   └── settingspage.tsx
    │   │   │   ├── footerlinks
    │   │   │   │   ├── FAQ.tsx
    │   │   │   │   ├── HealthBlog.tsx
    │   │   │   │   ├── HelpCentre.tsx
    │   │   │   │   ├── PrivacyPolicy.tsx
    │   │   │   │   └── TermsOfService.tsx
    │   │   │   ├── layout
    │   │   │   │   ├── doctor
    │   │   │   │   │   ├── Layout.tsx
    │   │   │   │   │   ├── footer.tsx
    │   │   │   │   │   └── navbar.tsx
    │   │   │   │   └── patient
    │   │   │   │       ├── Footer.tsx
    │   │   │   │       ├── Layout.tsx
    │   │   │   │       └── Navbar.tsx
    │   │   │   ├── payments
    │   │   │   │   ├── PaymentMethodCard.tsx
    │   │   │   │   ├── ThreeBackground.tsx
    │   │   │   │   └── Toast.tsx
    │   │   │   └── ui
    │   │   │       ├── AnimatedCard.tsx
    │   │   │       ├── AnimatedToast.tsx
    │   │   │       ├── Enhanced3DCard.tsx
    │   │   │       └── NeonButton.tsx
    │   │   ├── hooks
    │   │   │   └── useThreeSeatsScene.ts
    │   │   ├── lib
    │   │   │   └── web-rag.ts
    │   │   └── pages
    │   │       ├── LandingPage
    │   │       │   └── LandingPage.tsx
    │   │       ├── doctor
    │   │       │   └── Dashboard.tsx
    │   │       └── patient
    │   │           ├── About.tsx
    │   │           ├── AppointmentBookingPage.tsx
    │   │           ├── Contact.tsx
    │   │           ├── DashboardPage.tsx
    │   │           ├── DoctorsPage.tsx
    │   │           ├── HomePage.tsx
    │   │           ├── NotFoundPage.tsx
    │   │           ├── OAuthSuccessPage.tsx
    │   │           ├── env.d.ts
    │   │           ├── paymentspage.tsx
    │   │           └── services.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   ├── services
    │   │   └── APIService.ts
    │   └── vite-env.d.ts
    ├── tailwind.config.js
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts

```


---

## 🔧 Installation & Setup
```
1. ###Clone the repo### 
   ```bash
   git clone https://github.com/your-username/MedicoX.git
   cd MedicoX

2. ###Environment Variables###
     Copy and configure .env.example in both frontend/ and backend/

3. ###Required keys:###

     VITE_API_URL, VITE_GOOGLE_CLIENT_ID (frontend)

   PORT, MONGO_URI, JWT_SECRET, Google OAuth, Razorpay, SMTP credentials (backend)

4. ###Local Docker Deployment###


    docker compose up --build -d
    Backend at http://localhost:4000/api
    Frontend at http://localhost:5173

5. ###Manual Setup (without Docker)###

**Backend
- cd backend
- npm install
- npm run dev

**Frontend**
- cd frontend
- npm install
- npm run dev
```

## 🌐 API Endpoints

			
|Module Name   | Endpoint       | Method |  Description         |
|--------------|----------------|--------|----------------------|
|Auth          |/api/auth/signup|POST    |User registration     |
|              |/api/auth/login |POST    |User Login            |
|              |/api/auth/google|GET     |Google OAuth callback |
|Doctors       |--------------  |--------|----------------------| 
|Appointments  |--------------  |--------|----------------------| 
|Payments      |--------------  |--------|----------------------| 
|Notifications |--------------  |--------|----------------------|



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

### 👥 Contributing
Fork the project

Create your feature branch


git checkout -b feature/fooBar
Commit your changes


git commit -m "feat: add fooBar"
Push to the branch


git push origin feature/fooBar
Open a Pull Request

Please follow our Code of Conduct and Contributing Guide.

### 📄 License
Distributed under the MIT License. See LICENSE for more information.

## 📞 Contact
Project Lead: Akash Dass

Email: akash@example.com

GitHub: akash-dass

“Healing is a matter of time, but it is sometimes also a matter of opportunity.” – Hippocrates

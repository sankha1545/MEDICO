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

			
|Module Name   | Endpoint                       | Method        |  Description                 |
|--------------|--------------------------------|---------------|------------------------------|
|Auth          |/api/auth/signup                |POST           |User registration             |
|              |/api/auth/login                 |POST           |User Login                    |
|              |/api/auth/google                |GET            |Google OAuth callback         |
|Doctors       |/api/doctors/me                 |GET,           |Fetch & update                | 
|              |                                |PUT            |doctor profile                |
|Appointments  |/api/appointments/slots/:docId  |GET            |Fetch doctor's available slots| 
|              |/api/appointments/book          |POST           |Book an appointment           |
|Payments      |/api/payments/order             |POST           |Create razorpay order         | 
|Notifications |/api/notifications              |GET            |Retrieve user notifications   |

**Authentication:** endpoints that modify user data require a bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```
*All request/response payloads use application/json unless documented otherwise.*

## Environment variables ##

Create a .env file in the backend folder and populate with secure values. Example:
```
PORT=4000
DATABASE_URL=postgres://user:pass@db-host:5432/medicox
JWT_SECRET=replace_with_a_strong_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NODE_ENV=production
```
**DO NOT commit .env to git.** Use secret managers for production.

## Deployment ##

### TLS with Nginx & Certbot ###

- Ensure your DNS (e.g. api.yourdomain.com) points to the server IP.

- Install and configure Nginx as a reverse proxy to the backend container.

- Obtain TLS certificate with Certbot:
```
sudo certbot --nginx -d api.yourdomain.com
```

Certbot will configure Nginx for HTTPS and set up auto-renewal.

### Quick deploy on AWS EC2 (Ubuntu) ###

- Launch an Ubuntu instance and SSH into it.

- Install Docker & Docker Compose:
```
sudo apt update && sudo apt -y upgrade
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```
- Clone the repo, create .env, and run:
```
git clone <repo-url>
cd <repo-root>/backend
docker compose up -d --build
```
- Configure Nginx on the host to reverse proxy to the API container and secure with Certbot.

### Docker Compose example ###
Example docker-compose.yml for a minimal production-like setup (adjust volumes, networks, and secrets as appropriate):
```
version: '3.8'

services:
  auth:
    build:
      context: ./backend/auth
      dockerfile: Dockerfile
    container_name: medico-auth
    ports:
      - "4000:4000"
    env_file:
      - ./backend/auth/.env
    restart: unless-stopped
    networks:
      - medico-network

  chatbot:
    build:
      context: ./backend/components/chatbot
      dockerfile: Dockerfile
    container_name: medico-chatbot
    ports:
      - "8000:8000"
    env_file:
      - ./backend/components/chatbot/.env
    restart: unless-stopped
    networks:
      - medico-network

  contact:
    build:
      context: ./backend/pages/Contact
      dockerfile: Dockerfile
    container_name: medico-contact
    ports:
      - "5000:5000"
    env_file:
      - ./backend/pages/Contact/.env
    restart: unless-stopped
    networks:
      - medico-network

  prometheus:
    image: prom/prometheus:latest
    container_name: medico-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
    ports:
      - "9090:9090"
    depends_on:
      - auth
      - chatbot
      - contact
    restart: unless-stopped
    networks:
      - medico-network

  grafana:
    image: grafana/grafana:latest
    container_name: medico-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-storage:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - medico-network

volumes:
  grafana-storage:

networks:
  medico-network:
    driver: bridge
```
Bring up containers : 
```
docker compose up -d --build
```
### Nginx reverse proxy + Certbot (TLS) ###
**Nginx server block example (place at /etc/nginx/sites-available/medicox):**
```
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;   # or the backend container IP:port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

```
**Obtain TLS with Certbot:**
```
sudo certbot --nginx -d api.yourdomain.com

```
Certbot will modify your nginx config to use HTTPS and set up auto-renewal.
## AWS EC2 quick deploy (Ubuntu) ##
- 1. Launch Ubuntu EC2 & open ports 22, 80, 443, and any app port in security group.

- 2. SSH and install Docker & Compose:
     ```
     sudo apt update && sudo apt -y upgrade
     sudo apt install -y docker.io docker-compose
     sudo systemctl enable --now docker
     
     ```
- 3. Clone repo, configure .env, and run:
     ```
     git clone <repo-url>
     cd repo
     docker compose up -d --build

     ```
 - 4. Set up nginx + certbot on the instance to proxy TLS traffic to the backend container.
              
## Frontend hosting (Netlify) ##
- Connect repository to Netlify
- Build command.
```
npm run build
```
- Publish directory:
  ```
  dist/    # or build/ for CRA, .output/public for some frameworks

  ```
- Add environment variables (API base URL, public keys) via the provider dashboard.  

## Environment variables (.env.example) ##
Create .env in backend/ and fill values securely.
```
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://medicox:password@postgres:5432/medicox
JWT_SECRET=replace_with_strong_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=https://yourfrontend.com

```
**Do not commit secrets to source control.** Use secret managers (AWS Secrets Manager, GitHub Actions secrets) for production.

## 👥 Contributing ##

**Thank you for considering a contribution! Please follow the steps below.**

- 1) Fork the repository.

- 2) Create a feature branch:
     ```
     git checkout -b feature/your-feature-name

     ```
- 3) Commit your changes with clear messages:
   ```
     git commit -m "feat(api): add appointment validation"
   
- 4) Push the branch and open a Pull Request:
   ```
    git push origin feature/your-feature-name
   
- 5) Follow the project’s Code of Conduct and include tests or documentation for significant changes.
       

## 📞 Contact & Resources

- Backend routes: backend/src/routes (reference for full API)

- Live demos:

  - Frontend portfolio / demo: myportfolioxyx.netlify.app

  - Capstone project: medicox123.netlify.app

“Healing is a matter of time, but it is sometimes also a matter of opportunity.” – Hippocrates

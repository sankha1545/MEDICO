"use strict";
// File: backend/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const crypto_1 = __importDefault(require("crypto"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const medical_1 = __importDefault(require("./routes/medical"));
const appointment_1 = __importDefault(require("./routes/appointment"));
const payment_1 = __importDefault(require("./routes/payment"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const Webhook_1 = __importDefault(require("./routes/Webhook"));
const Doctor_1 = __importDefault(require("./routes/Doctor"));
const notificationsScheduler_1 = require("./utils/notificationsScheduler");
const medicalinfo_1 = __importDefault(require("./routes/medicalinfo"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// --- 1. Generate nonce for CSP per request ---
app.use((req, res, next) => {
    const nonce = crypto_1.default.randomBytes(16).toString('base64');
    res.locals.nonce = nonce;
    next();
});
// --- 2. Helmet with CSP and other security headers ---
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", (req, res) => `'nonce-${res.locals.nonce}'`,
                'https://accounts.google.com',
                'https://accounts.gstatic.com',
                'https://apis.google.com',
            ],
            frameSrc: ["'self'", 'https://accounts.google.com', 'https://*.google.com'],
            connectSrc: ["'self'", 'https://www.googleapis.com'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
}));
// --- 3. Logging ---
app.use((0, morgan_1.default)('combined'));
// --- 4. CORS: allow frontend origin, methods, and headers for multipart + auth ---
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// --- 5. Session (for Passport, if needed) ---
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
    },
}));
// --- 6. Body parsers ---
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- 7. Passport initialization ---
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use('/api/medicalinfo', medicalinfo_1.default);
// --- 8. Static file serving for uploads ---
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), { maxAge: '7d' }));
// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined');
    process.exit(1);
}
mongoose_1.default
    .connect(MONGO_URI, { autoIndex: true })
    .then(() => {
    console.log('✅ MongoDB connected');
    (0, notificationsScheduler_1.startNotificationScheduler)();
})
    .catch((err) => console.error('❌ MongoDB connection error:', err));
// --- Routes ---
// 9. Razorpay webhook needs raw body
app.post('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }), Webhook_1.default);
// 10. Mount API routes
app.use('/api/auth', auth_1.default);
app.use('/api/medical', medical_1.default);
app.use('/api/appointments', appointment_1.default);
app.use('/api/payments', payment_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/doctor', Doctor_1.default);
app.use('/api/medical/doctor', Doctor_1.default);
// 11. Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 12. Chrome DevTools preflight ping
app.use('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.sendStatus(204);
});
// 13. 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});
// 14. Global error handler
app.use((err, _req, res, _next) => {
    console.error('❌ Unhandled Error:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
});
// 15. Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

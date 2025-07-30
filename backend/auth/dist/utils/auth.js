"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// File: backend/routes/notifications.ts
const express_1 = __importDefault(require("express"));
const Notification_1 = __importDefault(require("../models/Notification"));
const auth_1 = __importDefault(require("../utils/auth"));
const router = express_1.default.Router();
// GET /api/notifications
router.get('/', auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, notifications });
    }
    catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifId = req.params.id;
        const notif = await Notification_1.default.findById(notifId);
        if (!notif) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }
        if (String(notif.userId) !== String(userId)) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        notif.read = true;
        await notif.save();
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error marking notification read:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
exports.default = router;

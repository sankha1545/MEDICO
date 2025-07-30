"use strict";
// File: backend/src/routes/notifications.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = require("mongoose");
const Notification_1 = __importDefault(require("../models/Notification"));
const auth_1 = require("./auth");
const router = express_1.default.Router();
/**
 * GET /api/notifications
 * List all notifications for the authenticated user, newest first.
 */
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user._id;
        const notifs = await Notification_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .lean();
        return res.json(notifs);
    }
    catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});
/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.put('/:id/read', auth_1.authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    try {
        const notif = await Notification_1.default.findById(id);
        if (!notif) {
            return res.status(404).json({ message: 'Notification not found.' });
        }
        // Ensure ownership
        if (notif.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        notif.read = true;
        await notif.save();
        return res.json({ success: true });
    }
    catch (err) {
        console.error('Error marking notification read:', err);
        return res.status(500).json({ message: 'Failed to mark notification read' });
    }
});
/**
 * DELETE /api/notifications/:id
 * Delete a notification.
 */
router.delete('/:id', auth_1.authenticateJWT, async (req, res) => {
    const { id } = req.params;
    console.log(`→ DELETE /api/notifications/${id} by user ${req.user._id}`);
    // 1) Validate ObjectId
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        console.log('   ✗ invalid ObjectId');
        return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    try {
        // 2) Attempt to delete if it matches both _id and userId
        const result = await Notification_1.default.deleteOne({
            _id: id,
            userId: req.user._id,
        });
        console.log('   deleteOne result:', result);
        if (result.deletedCount === 0) {
            // Either it didn’t exist, or it existed but belonged to someone else
            return res.status(404).json({ message: 'Notification not found.' });
        }
        console.log('   ✓ deleted');
        return res.sendStatus(204);
    }
    catch (err) {
        console.error('   ✗ error deleting notification:', err);
        return res.status(500).json({ message: 'Server error deleting notification.' });
    }
});
exports.default = router;

// File: backend/routes/notifications.ts
import express, { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { authenticate } from '../utils/auth';

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifId = req.params.id;
    const notif = await Notification.findById(notifId);
    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    if (String(notif.userId) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    notif.read = true;
    await notif.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;

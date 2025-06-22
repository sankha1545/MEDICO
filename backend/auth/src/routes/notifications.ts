// File: backend/src/routes/notifications.ts

import express, { Request, Response } from 'express';
import Notification from '../models/Notification';
import { authenticateJWT } from './auth';

const router = express.Router();

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifs = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(notifs);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifId = req.params.id;
    const notif = await Notification.findById(notifId);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    if (notif.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    notif.read = true;
    await notif.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
    return res.status(500).json({ message: 'Failed to mark notification read' });
  }
});

export default router;

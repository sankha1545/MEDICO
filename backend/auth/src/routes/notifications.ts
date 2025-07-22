// File: backend/src/routes/notifications.ts

import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import Notification, { INotification } from '../models/Notification';
import { authenticateJWT } from './auth';

const router = express.Router();

/**
 * GET /api/notifications
 * List all notifications for the authenticated user, newest first.
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const notifs = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean<INotification[]>();
    return res.json(notifs);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.put('/:id/read', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid notification ID.' });
  }

  try {
    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    // Ensure ownership
    if (notif.userId.toString() !== (req as any).user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    notif.read = true;
    await notif.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
    return res.status(500).json({ message: 'Failed to mark notification read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification.
 */
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`→ DELETE /api/notifications/${id} by user ${(req as any).user._id}`);

  // 1) Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    console.log('   ✗ invalid ObjectId');
    return res.status(400).json({ message: 'Invalid notification ID.' });
  }

  try {
    // 2) Attempt to delete if it matches both _id and userId
    const result = await Notification.deleteOne({
      _id: id,
      userId: (req as any).user._id,
    });

    console.log('   deleteOne result:', result);

    if (result.deletedCount === 0) {
      // Either it didn’t exist, or it existed but belonged to someone else
      return res.status(404).json({ message: 'Notification not found.' });
    }

    console.log('   ✓ deleted');
    return res.sendStatus(204);
  } catch (err) {
    console.error('   ✗ error deleting notification:', err);
    return res.status(500).json({ message: 'Server error deleting notification.' });
  }
});


export default router;

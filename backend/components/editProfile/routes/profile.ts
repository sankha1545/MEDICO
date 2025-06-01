import express from 'express';
import authMiddleware, { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/user';

const router = express.Router();

// Get user profile (protected)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (protected)
router.put('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

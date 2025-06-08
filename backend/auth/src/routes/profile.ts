// File: backend/src/routes/profile.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profileImages');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

router.put('/upload-profile-image', upload.single('profileImage'), async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const imagePath = `/uploads/profileImages/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, { profileImage: imagePath }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Image uploaded', imagePath });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

export default router;

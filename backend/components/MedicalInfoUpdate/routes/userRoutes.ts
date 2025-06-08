// File: backend/src/routes/userRoutes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User, { IUser } from '../models/User';
import { protect } from '../middleware/auth'; // your JWT auth middleware

const router = Router();

/**
 * 1. Multer diskStorage configuration
 *    → destination: “backend/uploads”
 *    → filename:   <userId>-<timestamp>.<ext>
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure `backend/uploads/` exists
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g. userId‐timestamp.ext
    // @ts-ignore
    const userId = (req.user as IUser)?._id || 'anon';
    const ext = path.extname(file.originalname); 
    const filename = `${userId}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// 2. File filter + size limit (optional)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only allow images
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * 3. PUT /api/users/me
 *    → “protect” ensures req.user is set to the logged‐in user
 *    → upload.single('profileImage') parses the file
 *    → We then update name/email (if provided) + profileImageUrl (if file uploaded)
 */
router.put(
  '/me',
  protect,
  upload.single('profileImage'),
  async (req: Request & { user?: IUser }, res: Response) => {
    try {
      // 3.1. Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // 3.2. Find the user document
      const userInDb = await User.findById(req.user._id);
      if (!userInDb) {
        return res.status(404).json({ message: 'User not found' });
      }

      // 3.3. Update any text fields
      const { name, email } = req.body;
      if (name)  userInDb.name  = name;
      if (email) userInDb.email = email;

      // 3.4. If a file was uploaded, delete old file (optional), then save new path
      if (req.file) {
        // OPTIONAL: delete the old profile image from disk
        if (userInDb.profileImageUrl) {
          const oldFilename = path.basename(userInDb.profileImageUrl);
          const oldFilePath = path.join(__dirname, '../../uploads', oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        // Save new image path
        userInDb.profileImageUrl = `/uploads/${req.file.filename}`;
      }

      // 3.5. Save the updated user
      const updatedUser = await userInDb.save();

      // 3.6. Return updated user (omit password)
      return res.json({
        _id:             updatedUser._id,
        name:            updatedUser.name,
        email:           updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl,
        // …any other fields you want to expose…
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;

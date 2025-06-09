import express, { Request, Response } from 'express';
import { authenticateJWT } from './auth';
import Doctor from '../models/Doctor';

const router = express.Router();

/**
 * GET /api/medical/doctors
 * Public or protected—returns list of basic doctor info.
 */
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const docs = await Doctor.find().select(
      'name specialty rating reviewCount experience hospitalAffiliation location availableSlots nextAvailable profileImage'
    );
    // Map each to the shape your frontend expects
    const list = docs.map((d) => ({
      id: d._id,
      name: d.name,
      specialty: d.specialty,
      rating: (d as any).rating ?? 4.5,          // stubbed if you lack a rating field
      reviewCount: (d as any).reviewCount ?? 12, // stubbed if missing
      experience: d.experience ?? '10 years',    // stub if needed
      hospitalAffiliation: d.hospitalAffiliation ?? 'General Hospital',
      location: d.location ?? 'Unknown',
      availableSlots: (d as any).availableSlots ?? 3,
      nextAvailable: (d as any).nextAvailable ?? 'Tomorrow 10:00 AM',
      image:
        d.profileImage?.data && d.profileImage.contentType
          ? `data:${d.profileImage.contentType};base64,${d.profileImage.data.toString(
              'base64'
            )}`
          : `${process.env.FRONTEND_URL}/default-doctor.png`,
    }));
    res.json(list);
  } catch (err) {
    console.error('Error fetching doctors list:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/medical/doctors/:id
 * Protected by JWT, returns full doctor document for profile modal.
 */
router.get(
  '/doctors/:id',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const d = await Doctor.findById(req.params.id);
      if (!d) return res.status(404).json({ message: 'Doctor not found' });

      // Build response shape (include any extra fields)
      const profile = {
        id: d._id,
        name: d.name,
        specialty: d.specialty,
        rating: (d as any).rating ?? 4.5,
        reviewCount: (d as any).reviewCount ?? 12,
        experience: d.experience ?? '10 years',
        hospitalAffiliation: d.hospitalAffiliation ?? 'General Hospital',
        location: d.location ?? 'Unknown',
        availableSlots: (d as any).availableSlots ?? 3,
        nextAvailable: (d as any).nextAvailable ?? 'Tomorrow 10:00 AM',
        image:
          d.profileImage?.data && d.profileImage.contentType
            ? `data:${d.profileImage.contentType};base64,${d.profileImage.data.toString(
                'base64'
              )}`
            : `${process.env.FRONTEND_URL}/default-doctor.png`,
        bio: (d as any).bio || '',
        qualifications: (d as any).qualifications || [],
        languages: (d as any).languages || [],
      };

      res.json(profile);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;

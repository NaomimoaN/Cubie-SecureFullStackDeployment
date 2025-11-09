// server/routes/profileImage.js
import express from 'express';
import { downloadFile } from '../services/s3Service.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';

const router = express.Router();

// Route to serve profile images through backend proxy
router.get('/profile-image/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user and get their profile picture key
    const user = await User.findById(userId).select('profile.profilePictureKey');
    
    if (!user || !user.profile?.profilePictureKey) {
      console.log('Profile picture key not found for user:', userId);
      console.log('User profile:', user?.profile);
      return res.status(404).json({ message: 'Profile picture not found' });
    }
    
    // Download the file from S3
    const fileBuffer = await downloadFile(user.profile.profilePictureKey);
    
    // Set appropriate headers for image display
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': process.env.CLIENT_URL || 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    // Send the image data
    res.send(Buffer.from(fileBuffer));
    
  } catch (error) {
    console.error('Error serving profile image:', error);
    res.status(500).json({ message: 'Error serving profile image' });
  }
});

export default router;
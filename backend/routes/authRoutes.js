import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getGoogleAuthUrl, 
  googlePickerPage, 
  googleSimulate, 
  googleCallback 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth / Gmail integration
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/picker', googlePickerPage);
router.post('/google/simulate', googleSimulate);
router.get('/google/callback', googleCallback);

export default router;

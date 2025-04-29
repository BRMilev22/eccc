import express from 'express';
import { uploadImage } from '../controllers/uploadController';
import { upload } from '../services/uploadService';

const router = express.Router();

// Route for image uploads
router.post('/upload', upload.single('image'), uploadImage);

export default router; 
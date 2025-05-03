import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getReportsByUser,
} from '../controllers/trashReportController';

const router = express.Router();

// Debug route to test server health
router.get('/debug', (req, res) => {
  res.status(200).json({ message: 'Debug route is working', auth: !!req.headers.authorization });
});

// Public routes - no authentication required
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', createReport); // Guest submissions allowed

// Protected routes - authentication optional but user data attached if authenticated
router.put('/:id', protect, updateReport);
router.patch('/:id', protect, updateReport); // Add PATCH endpoint for partial updates
router.delete('/:id', protect, deleteReport);
router.get('/user/:userId', protect, getReportsByUser);

export default router; 
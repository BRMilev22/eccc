import express from 'express';
import { createReport, getAllReports, getReportById } from '../controllers/trashReportController';

const router = express.Router();

router.post('/reports', createReport);
router.get('/reports', getAllReports);
router.get('/reports/:id', getReportById);

export default router; 
import { Request, Response } from 'express';
import { createTrashReport, getAllTrashReports, getTrashReportById, TrashReport } from '../models/trashReport';

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoUrl, latitude, longitude, description } = req.body;

    // Validate input
    if (!photoUrl || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Photo URL, latitude, and longitude are required' });
      return;
    }

    const trashReport: TrashReport = {
      photoUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description
    };

    const newReport = await createTrashReport(trashReport);
    
    // Format response with both photoUrl and photo_url for consistency
    const response = {
      ...newReport,
      photo_url: newReport.photoUrl, // Add snake_case version for mobile app
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating trash report:', error);
    res.status(500).json({ error: 'Failed to create trash report' });
  }
};

export const getAllReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reports = await getAllTrashReports();
    
    // Format each report to include both photoUrl and photo_url
    const formattedReports = reports.map(report => ({
      ...report,
      photo_url: report.photoUrl, // Ensure snake_case for older clients
      photoUrl: report.photoUrl,  // Ensure camelCase for newer clients
    }));
    
    res.status(200).json(formattedReports);
  } catch (error) {
    console.error('Error fetching trash reports:', error);
    res.status(500).json({ error: 'Failed to fetch trash reports' });
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    const report = await getTrashReportById(id);
    if (!report) {
      res.status(404).json({ error: 'Trash report not found' });
      return;
    }

    // Format response with both photoUrl and photo_url
    const formattedReport = {
      ...report,
      photo_url: report.photoUrl, // Add snake_case version for mobile app
    };
    
    res.status(200).json(formattedReport);
  } catch (error) {
    console.error('Error fetching trash report:', error);
    res.status(500).json({ error: 'Failed to fetch trash report' });
  }
}; 
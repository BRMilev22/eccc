import { Request, Response } from 'express';
import { 
  createTrashReport, 
  getAllTrashReports, 
  getTrashReportById, 
  updateTrashReportStatus,
  getReportsByUserId,
  updateTrashReport,
  deleteTrashReportById
} from '../models/trashReport';

// Get all trash reports
export const getAllReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await getAllTrashReports();
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error getting trash reports:', error);
    res.status(500).json({ error: 'Failed to retrieve trash reports' });
  }
};

// Get a specific trash report by ID
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid report ID' });
      return;
    }
    
    const report = await getTrashReportById(id);
    
    if (!report) {
      res.status(404).json({ error: 'Trash report not found' });
      return;
    }
    
    res.status(200).json(report);
  } catch (error) {
    console.error('Error getting trash report:', error);
    res.status(500).json({ error: 'Failed to retrieve trash report' });
  }
};

// Create a new trash report
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoUrl, latitude, longitude, description, trashType, severityLevel, status } = req.body;
    
    // Get user ID from auth token if available
    const userId = (req as any).user?.id || null;
    
    // Validate required fields
    if (!photoUrl || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Photo URL, latitude, and longitude are required' });
      return;
    }
    
    // Check if this is a guest submission (description contains [Reported by Guest])
    const isGuest = description && description.includes('[Reported by Guest]');
    
    // Create report
    const newReport = await createTrashReport({
      userId,
      photoUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description,
      trashType,
      severityLevel,
      status: status || 'REPORTED'
    });
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating trash report:', error);
    res.status(500).json({ error: 'Failed to create trash report' });
  }
};

// Create a new trash report as a guest (no authentication required)
export const createGuestReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoUrl, latitude, longitude, description, trashType, severityLevel, status } = req.body;
    
    // Validate required fields
    if (!photoUrl || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Photo URL, latitude, and longitude are required' });
      return;
    }
    
    // Add "Guest" indicator to the description if not empty
    let guestDescription = description || '';
    if (guestDescription) {
      guestDescription = `${guestDescription} [Reported by Guest]`;
    } else {
      guestDescription = '[Reported by Guest]';
    }
    
    // Create report with special guest indicator
    const newReport = await createTrashReport({
      userId: null, // No user ID for guest
      photoUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description: guestDescription,
      trashType,
      severityLevel,
      status: status || 'REPORTED'
    });
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating guest trash report:', error);
    res.status(500).json({ error: 'Failed to create guest trash report' });
  }
};

// Update a trash report's status
export const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid report ID' });
      return;
    }
    
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    
    const success = await updateTrashReportStatus(id, status);
    
    if (!success) {
      res.status(404).json({ error: 'Trash report not found' });
      return;
    }
    
    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating trash report status:', error);
    res.status(500).json({ error: 'Failed to update trash report status' });
  }
};

// Get trash reports by user ID
export const getReportsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the authenticated user's ID
    const authUser = (req as any).user;
    
    // Allow guest access to routes
    let userId;
    if (req.params.userId) {
      userId = parseInt(req.params.userId);
    } else if (authUser && authUser.id) {
      userId = authUser.id;
    } else {
      res.status(400).json({ error: 'User ID required' });
      return;
    }
    
    const reports = await getReportsByUserId(userId);
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error getting user trash reports:', error);
    res.status(500).json({ error: 'Failed to retrieve user trash reports' });
  }
};

// Update a trash report (including trash type and severity)
export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { description, status, trashType, severityLevel } = req.body;
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid report ID' });
      return;
    }
    
    // Check if there's anything to update
    if (!description && !status && !trashType && !severityLevel) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    
    const success = await updateTrashReport(id, {
      description,
      status,
      trashType,
      severityLevel
    });
    
    if (!success) {
      res.status(404).json({ error: 'Trash report not found' });
      return;
    }
    
    res.status(200).json({ message: 'Trash report updated successfully' });
  } catch (error) {
    console.error('Error updating trash report:', error);
    res.status(500).json({ error: 'Failed to update trash report' });
  }
};

// Delete a trash report
export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid report ID' });
      return;
    }
    
    const success = await deleteTrashReportById(id);
    
    if (!success) {
      res.status(404).json({ error: 'Trash report not found' });
      return;
    }
    
    res.status(200).json({ message: 'Trash report deleted successfully' });
  } catch (error) {
    console.error('Error deleting trash report:', error);
    res.status(500).json({ error: 'Failed to delete trash report' });
  }
}; 
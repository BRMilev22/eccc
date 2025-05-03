import pool from '../config/db';

export interface TrashReport {
  id?: number;
  userId?: number | null;
  photoUrl: string;
  latitude: number;
  longitude: number;
  description?: string;
  trashType?: 'PLASTIC' | 'FOOD' | 'HAZARDOUS' | 'PAPER' | 'ELECTRONICS' | 'MIXED';
  severityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'REPORTED' | 'IN_PROGRESS' | 'CLEANED' | 'VERIFIED';
  createdAt?: Date;
  updatedAt?: Date;
}

export const createTrashReport = async (trashReport: TrashReport): Promise<TrashReport> => {
  const status = trashReport.status || 'REPORTED';
  
  const [result] = await pool.execute(
    `INSERT INTO trash_reports 
    (user_id, photo_url, latitude, longitude, description, trash_type, severity_level, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trashReport.userId || null,
      trashReport.photoUrl, 
      trashReport.latitude, 
      trashReport.longitude, 
      trashReport.description || null,
      trashReport.trashType || null,
      trashReport.severityLevel || null,
      status
    ]
  );
  
  const insertId = (result as any).insertId;
  return { ...trashReport, id: insertId };
};

export const getAllTrashReports = async (): Promise<TrashReport[]> => {
  const [rows] = await pool.query(`
    SELECT 
      id, user_id as userId, photo_url as photoUrl, 
      latitude, longitude, description, 
      trash_type as trashType, severity_level as severityLevel, 
      status, created_at as createdAt, updated_at as updatedAt 
    FROM trash_reports 
    ORDER BY created_at DESC
  `);
  
  return (rows as any[]).map(row => ({
    ...row,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null
  }));
};

export const getTrashReportById = async (id: number): Promise<TrashReport | null> => {
  const [rows] = await pool.execute(`
    SELECT 
      id, user_id as userId, photo_url as photoUrl, 
      latitude, longitude, description, 
      trash_type as trashType, severity_level as severityLevel, 
      status, created_at as createdAt, updated_at as updatedAt 
    FROM trash_reports 
    WHERE id = ?
  `, [id]);
  
  const reports = rows as any[];
  
  if (!reports.length) return null;
  
  const report = reports[0];
  return {
    ...report,
    latitude: parseFloat(report.latitude),
    longitude: parseFloat(report.longitude),
    createdAt: report.createdAt ? new Date(report.createdAt).toISOString() : null,
    updatedAt: report.updatedAt ? new Date(report.updatedAt).toISOString() : null
  };
};

export const updateTrashReportStatus = async (id: number, status: string): Promise<boolean> => {
  const [result] = await pool.execute(
    'UPDATE trash_reports SET status = ? WHERE id = ?',
    [status, id]
  );
  
  return (result as any).affectedRows > 0;
};

export const getReportsByUserId = async (userId: number): Promise<TrashReport[]> => {
  const [rows] = await pool.execute(`
    SELECT 
      id, user_id as userId, photo_url as photoUrl, 
      latitude, longitude, description, 
      trash_type as trashType, severity_level as severityLevel, 
      status, created_at as createdAt, updated_at as updatedAt 
    FROM trash_reports 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId]);
  
  return (rows as any[]).map(row => ({
    ...row,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude)
  }));
};

export const updateTrashReport = async (id: number, report: Partial<TrashReport>): Promise<boolean> => {
  // Build dynamic SQL based on what fields are provided
  const fields: string[] = [];
  const values: any[] = [];
  
  if (report.status !== undefined) {
    fields.push('status = ?');
    values.push(report.status);
  }
  
  if (report.description !== undefined) {
    fields.push('description = ?');
    values.push(report.description);
  }
  
  if (report.trashType !== undefined) {
    fields.push('trash_type = ?');
    values.push(report.trashType);
  }
  
  if (report.severityLevel !== undefined) {
    fields.push('severity_level = ?');
    values.push(report.severityLevel);
  }
  
  if (fields.length === 0) {
    return false; // Nothing to update
  }
  
  // Add ID to values array
  values.push(id);
  
  const [result] = await pool.execute(
    `UPDATE trash_reports SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  return (result as any).affectedRows > 0;
};

export const deleteTrashReportById = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute(
    'DELETE FROM trash_reports WHERE id = ?',
    [id]
  );
  
  return (result as any).affectedRows > 0;
}; 
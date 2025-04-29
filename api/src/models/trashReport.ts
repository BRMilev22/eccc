import pool from '../config/db';

export interface TrashReport {
  id?: number;
  photoUrl: string;
  latitude: number;
  longitude: number;
  description?: string;
  createdAt?: Date;
}

export const createTrashReport = async (trashReport: TrashReport): Promise<TrashReport> => {
  const [result] = await pool.execute(
    'INSERT INTO trash_reports (photo_url, latitude, longitude, description) VALUES (?, ?, ?, ?)',
    [trashReport.photoUrl, trashReport.latitude, trashReport.longitude, trashReport.description || null]
  );
  
  const insertId = (result as any).insertId;
  return { ...trashReport, id: insertId };
};

export const getAllTrashReports = async (): Promise<TrashReport[]> => {
  const [rows] = await pool.query('SELECT * FROM trash_reports ORDER BY created_at DESC');
  return rows as TrashReport[];
};

export const getTrashReportById = async (id: number): Promise<TrashReport | null> => {
  const [rows] = await pool.execute('SELECT * FROM trash_reports WHERE id = ?', [id]);
  const reports = rows as TrashReport[];
  return reports.length ? reports[0] : null;
}; 
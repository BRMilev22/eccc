"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTrashReportById = exports.updateTrashReport = exports.getReportsByUserId = exports.updateTrashReportStatus = exports.getTrashReportById = exports.getAllTrashReports = exports.createTrashReport = void 0;
const db_1 = __importDefault(require("../config/db"));
const createTrashReport = (trashReport) => __awaiter(void 0, void 0, void 0, function* () {
    const status = trashReport.status || 'REPORTED';
    const [result] = yield db_1.default.execute(`INSERT INTO trash_reports 
    (user_id, photo_url, latitude, longitude, description, trash_type, severity_level, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        trashReport.userId || null,
        trashReport.photoUrl,
        trashReport.latitude,
        trashReport.longitude,
        trashReport.description || null,
        trashReport.trashType || null,
        trashReport.severityLevel || null,
        status
    ]);
    const insertId = result.insertId;
    return Object.assign(Object.assign({}, trashReport), { id: insertId });
});
exports.createTrashReport = createTrashReport;
const getAllTrashReports = () => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.query(`
    SELECT 
      id, user_id as userId, photo_url as photoUrl, 
      latitude, longitude, description, 
      trash_type as trashType, severity_level as severityLevel, 
      status, created_at as createdAt, updated_at as updatedAt 
    FROM trash_reports 
    ORDER BY created_at DESC
  `);
    return rows.map(row => (Object.assign(Object.assign({}, row), { latitude: parseFloat(row.latitude), longitude: parseFloat(row.longitude), createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null, updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null })));
});
exports.getAllTrashReports = getAllTrashReports;
const getTrashReportById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.execute(`
    SELECT 
      id, user_id as userId, photo_url as photoUrl, 
      latitude, longitude, description, 
      trash_type as trashType, severity_level as severityLevel, 
      status, created_at as createdAt, updated_at as updatedAt 
    FROM trash_reports 
    WHERE id = ?
  `, [id]);
    const reports = rows;
    if (!reports.length)
        return null;
    const report = reports[0];
    return Object.assign(Object.assign({}, report), { latitude: parseFloat(report.latitude), longitude: parseFloat(report.longitude), createdAt: report.createdAt ? new Date(report.createdAt).toISOString() : null, updatedAt: report.updatedAt ? new Date(report.updatedAt).toISOString() : null });
});
exports.getTrashReportById = getTrashReportById;
const updateTrashReportStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield db_1.default.execute('UPDATE trash_reports SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows > 0;
});
exports.updateTrashReportStatus = updateTrashReportStatus;
const getReportsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield db_1.default.execute(`
    SELECT 
      id, user_id as userId, photo_url as photoUrl, 
      latitude, longitude, description, 
      trash_type as trashType, severity_level as severityLevel, 
      status, created_at as createdAt, updated_at as updatedAt 
    FROM trash_reports 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId]);
    return rows.map(row => (Object.assign(Object.assign({}, row), { latitude: parseFloat(row.latitude), longitude: parseFloat(row.longitude) })));
});
exports.getReportsByUserId = getReportsByUserId;
const updateTrashReport = (id, report) => __awaiter(void 0, void 0, void 0, function* () {
    // Build dynamic SQL based on what fields are provided
    const fields = [];
    const values = [];
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
    const [result] = yield db_1.default.execute(`UPDATE trash_reports SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows > 0;
});
exports.updateTrashReport = updateTrashReport;
const deleteTrashReportById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield db_1.default.execute('DELETE FROM trash_reports WHERE id = ?', [id]);
    return result.affectedRows > 0;
});
exports.deleteTrashReportById = deleteTrashReportById;

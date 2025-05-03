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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.updateReport = exports.getReportsByUser = exports.updateReportStatus = exports.createGuestReport = exports.createReport = exports.getReportById = exports.getAllReports = void 0;
const trashReport_1 = require("../models/trashReport");
// Get all trash reports
const getAllReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield (0, trashReport_1.getAllTrashReports)();
        res.status(200).json(reports);
    }
    catch (error) {
        console.error('Error getting trash reports:', error);
        res.status(500).json({ error: 'Failed to retrieve trash reports' });
    }
});
exports.getAllReports = getAllReports;
// Get a specific trash report by ID
const getReportById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid report ID' });
            return;
        }
        const report = yield (0, trashReport_1.getTrashReportById)(id);
        if (!report) {
            res.status(404).json({ error: 'Trash report not found' });
            return;
        }
        res.status(200).json(report);
    }
    catch (error) {
        console.error('Error getting trash report:', error);
        res.status(500).json({ error: 'Failed to retrieve trash report' });
    }
});
exports.getReportById = getReportById;
// Create a new trash report
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { photoUrl, latitude, longitude, description, trashType, severityLevel, status } = req.body;
        // Get user ID from auth token if available
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
        // Validate required fields
        if (!photoUrl || latitude === undefined || longitude === undefined) {
            res.status(400).json({ error: 'Photo URL, latitude, and longitude are required' });
            return;
        }
        // Check if this is a guest submission (description contains [Reported by Guest])
        const isGuest = description && description.includes('[Reported by Guest]');
        // Create report
        const newReport = yield (0, trashReport_1.createTrashReport)({
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
    }
    catch (error) {
        console.error('Error creating trash report:', error);
        res.status(500).json({ error: 'Failed to create trash report' });
    }
});
exports.createReport = createReport;
// Create a new trash report as a guest (no authentication required)
const createGuestReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else {
            guestDescription = '[Reported by Guest]';
        }
        // Create report with special guest indicator
        const newReport = yield (0, trashReport_1.createTrashReport)({
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
    }
    catch (error) {
        console.error('Error creating guest trash report:', error);
        res.status(500).json({ error: 'Failed to create guest trash report' });
    }
});
exports.createGuestReport = createGuestReport;
// Update a trash report's status
const updateReportStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const success = yield (0, trashReport_1.updateTrashReportStatus)(id, status);
        if (!success) {
            res.status(404).json({ error: 'Trash report not found' });
            return;
        }
        res.status(200).json({ message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Error updating trash report status:', error);
        res.status(500).json({ error: 'Failed to update trash report status' });
    }
});
exports.updateReportStatus = updateReportStatus;
// Get trash reports by user ID
const getReportsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the authenticated user's ID
        const authUser = req.user;
        // Allow guest access to routes
        let userId;
        if (req.params.userId) {
            userId = parseInt(req.params.userId);
        }
        else if (authUser && authUser.id) {
            userId = authUser.id;
        }
        else {
            res.status(400).json({ error: 'User ID required' });
            return;
        }
        const reports = yield (0, trashReport_1.getReportsByUserId)(userId);
        res.status(200).json(reports);
    }
    catch (error) {
        console.error('Error getting user trash reports:', error);
        res.status(500).json({ error: 'Failed to retrieve user trash reports' });
    }
});
exports.getReportsByUser = getReportsByUser;
// Update a trash report (including trash type and severity)
const updateReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const success = yield (0, trashReport_1.updateTrashReport)(id, {
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
    }
    catch (error) {
        console.error('Error updating trash report:', error);
        res.status(500).json({ error: 'Failed to update trash report' });
    }
});
exports.updateReport = updateReport;
// Delete a trash report
const deleteReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid report ID' });
            return;
        }
        const success = yield (0, trashReport_1.deleteTrashReportById)(id);
        if (!success) {
            res.status(404).json({ error: 'Trash report not found' });
            return;
        }
        res.status(200).json({ message: 'Trash report deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting trash report:', error);
        res.status(500).json({ error: 'Failed to delete trash report' });
    }
});
exports.deleteReport = deleteReport;

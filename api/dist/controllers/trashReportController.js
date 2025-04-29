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
exports.getReportById = exports.getAllReports = exports.createReport = void 0;
const trashReport_1 = require("../models/trashReport");
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { photoUrl, latitude, longitude, description } = req.body;
        // Validate input
        if (!photoUrl || latitude === undefined || longitude === undefined) {
            res.status(400).json({ error: 'Photo URL, latitude, and longitude are required' });
            return;
        }
        const trashReport = {
            photoUrl,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            description
        };
        const newReport = yield (0, trashReport_1.createTrashReport)(trashReport);
        res.status(201).json(newReport);
    }
    catch (error) {
        console.error('Error creating trash report:', error);
        res.status(500).json({ error: 'Failed to create trash report' });
    }
});
exports.createReport = createReport;
const getAllReports = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield (0, trashReport_1.getAllTrashReports)();
        res.status(200).json(reports);
    }
    catch (error) {
        console.error('Error fetching trash reports:', error);
        res.status(500).json({ error: 'Failed to fetch trash reports' });
    }
});
exports.getAllReports = getAllReports;
const getReportById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID format' });
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
        console.error('Error fetching trash report:', error);
        res.status(500).json({ error: 'Failed to fetch trash report' });
    }
});
exports.getReportById = getReportById;

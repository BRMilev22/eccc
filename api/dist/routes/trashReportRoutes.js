"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trashReportController_1 = require("../controllers/trashReportController");
const router = express_1.default.Router();
router.post('/reports', trashReportController_1.createReport);
router.get('/reports', trashReportController_1.getAllReports);
router.get('/reports/:id', trashReportController_1.getReportById);
exports.default = router;

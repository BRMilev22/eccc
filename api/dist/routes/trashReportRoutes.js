"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const trashReportController_1 = require("../controllers/trashReportController");
const router = express_1.default.Router();
// Debug route to test server health
router.get('/debug', (req, res) => {
    res.status(200).json({ message: 'Debug route is working', auth: !!req.headers.authorization });
});
// Public routes - no authentication required
router.get('/', trashReportController_1.getAllReports);
router.get('/:id', trashReportController_1.getReportById);
router.post('/', trashReportController_1.createReport); // Guest submissions allowed
// Protected routes - authentication optional but user data attached if authenticated
router.put('/:id', authMiddleware_1.protect, trashReportController_1.updateReport);
router.patch('/:id', authMiddleware_1.protect, trashReportController_1.updateReport); // Add PATCH endpoint for partial updates
router.delete('/:id', authMiddleware_1.protect, trashReportController_1.deleteReport);
router.get('/user/:userId', authMiddleware_1.protect, trashReportController_1.getReportsByUser);
exports.default = router;

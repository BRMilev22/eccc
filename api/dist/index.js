"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const trashReportRoutes_1 = __importDefault(require("./routes/trashReportRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// Routes
app.use('/api', uploadRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/reports', trashReportRoutes_1.default);
// Home route
app.get('/', (_req, res) => {
    res.send('ECCC API is running');
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;

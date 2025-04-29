"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrl = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
// Create uploads directory if it doesn't exist
const uploadsDir = path_1.default.join(__dirname, '../../public/uploads');
fs_extra_1.default.ensureDirSync(uploadsDir);
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueFileName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueFileName);
    }
});
// File filter to only allow images
const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
// Create the multer upload instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
exports.upload = upload;
// Helper function to get the complete URL for an uploaded image
const getImageUrl = (req, filename) => {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${filename}`;
};
exports.getImageUrl = getImageUrl;

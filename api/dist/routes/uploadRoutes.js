"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadController_1 = require("../controllers/uploadController");
const uploadService_1 = require("../services/uploadService");
const router = express_1.default.Router();
// Route for image uploads
router.post('/upload', uploadService_1.upload.single('image'), uploadController_1.uploadImage);
exports.default = router;

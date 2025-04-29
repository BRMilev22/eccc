"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const uploadService_1 = require("../services/uploadService");
const uploadImage = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate the publicly accessible URL for the image
        const imageUrl = (0, uploadService_1.getImageUrl)(req, req.file.filename);
        // Return the image URL that can be used in the mobile app
        res.status(200).json({
            success: true,
            imageUrl,
            filename: req.file.filename,
            message: 'File uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.uploadImage = uploadImage;

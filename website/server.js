const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.0.110:3000/api';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper function to categorize trash types in Bulgarian
function getTrashTypeInBulgarian(type) {
    const types = {
        'PLASTIC': 'Пластмаса',
        'FOOD': 'Хранителни отпадъци',
        'HAZARDOUS': 'Опасни отпадъци',
        'PAPER': 'Хартия',
        'ELECTRONICS': 'Електроника',
        'MIXED': 'Смесени отпадъци'
    };
    return types[type] || type;
}

// Helper function to get severity in Bulgarian (maps database severity_level to display)
function getSeverityInBulgarian(severityLevel) {
    const severities = {
        'LOW': { name: 'Ниска', color: '#28a745', description: 'Ниска' },
        'MEDIUM': { name: 'Средна', color: '#ffc107', description: 'Средна' },
        'HIGH': { name: 'Висока', color: '#dc3545', description: 'Висока' }
    };
    return severities[severityLevel] || { name: severityLevel, color: '#6c757d', description: severityLevel };
}

// Helper function to get status in Bulgarian
function getStatusInBulgarian(status) {
    const statuses = {
        'REPORTED': 'Докладван',
        'IN_PROGRESS': 'В процес', 
        'CLEANED': 'Почистен',
        'VERIFIED': 'Потвърден'
    };
    return statuses[status] || status;
}

// Routes
app.get('/', async (req, res) => {
    try {
        // Fetch reports from API
        const response = await axios.get(`${API_BASE_URL}/reports`);
        const reports = Array.isArray(response.data) ? response.data : (response.data.reports || []);
        
        // Process reports for display
        const processedReports = reports.map(report => ({
            ...report,
            trashTypeInBulgarian: getTrashTypeInBulgarian(report.trashType),
            severityInfo: getSeverityInBulgarian(report.severityLevel), // Use severityLevel from API
            statusInBulgarian: getStatusInBulgarian(report.status),
            createdAt: new Date(report.createdAt).toLocaleDateString('bg-BG') // Use createdAt from API
        }));

        // Calculate statistics (map database statuses)
        const stats = {
            totalReports: reports.length,
            resolvedReports: reports.filter(r => r.status === 'CLEANED' || r.status === 'VERIFIED').length,
            pendingReports: reports.filter(r => r.status === 'REPORTED').length,
            inProgressReports: reports.filter(r => r.status === 'IN_PROGRESS').length
        };

        res.render('index', { 
            reports: processedReports,
            stats: stats,
            reportsJson: JSON.stringify(processedReports)
        });
    } catch (error) {
        console.error('Error fetching reports:', error.message);
        // Render with empty data if API is not available
        res.render('index', { 
            reports: [],
            stats: { totalReports: 0, resolvedReports: 0, pendingReports: 0, inProgressReports: 0 },
            reportsJson: JSON.stringify([])
        });
    }
});

// API endpoint to get reports (for AJAX calls)
app.get('/api/reports', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reports`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching reports:', error.message);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🧪 ChemEco Website is running on http://localhost:${PORT}`);
    console.log(`📡 API Base URL: ${API_BASE_URL}`);
});

module.exports = app;

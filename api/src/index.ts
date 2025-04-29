import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import trashReportRoutes from './routes/trashReportRoutes';
import uploadRoutes from './routes/uploadRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api', trashReportRoutes);
app.use('/api', uploadRoutes);

// Home route
app.get('/', (_req, res) => {
  res.send('ECCC API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app; 
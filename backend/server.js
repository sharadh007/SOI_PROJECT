const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
require('./config/firebase');
const app = express();

// Core middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

const pool = require('./config/database');

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ DB Connection failed:', err);
  else console.log('✅ PostgreSQL connected:', res.rows[0]);
});
// Routes
const authRoutes = require('./routes/auth');
const internshipRoutes = require('./routes/internships');
const studentRoutes = require('./routes/students');
const recommendationRoutes = require('./routes/recommendations');
const applicationRoutes = require('./routes/applications');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Backend Server Running',
    timestamp: new Date(),
    message: 'PM Internship Portal Backend is Active'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/applications', applicationRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', path: req.path });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend Server running on http://localhost:${PORT}`);
});

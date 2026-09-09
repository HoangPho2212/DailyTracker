require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dayRoutes = require('./routes/dayRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/days', dayRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Daily Tracker API' });
});

// Serve frontend static build if present (for single-container/monolith deployment)
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Standard 404 handler (JayContract)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errorCode: 'ROUTE_NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: err.message || 'Internal server error',
    errorCode: 'INTERNAL_SERVER_ERROR'
  });
});

module.exports = { app };

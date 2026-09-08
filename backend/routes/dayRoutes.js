const express = require('express');
const router = express.Router();
const dayController = require('../controllers/dayController');

// Analytics route (placed before /:date)
router.get('/analytics/summary', dayController.getAnalyticsSummary);

// Collection route: GET /api/days
router.get('/', dayController.getAllDays);

router.get('/:date', dayController.getDay);
router.post('/:date/tasks', dayController.addTask);
router.patch('/:date/tasks/:taskId', dayController.updateTask);
router.delete('/:date/tasks/:taskId', dayController.deleteTask);

module.exports = router;

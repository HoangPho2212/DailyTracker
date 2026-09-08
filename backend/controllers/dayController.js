const mongoose = require('mongoose');
const Day = require('../models/Day');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Helper for date validation
const isValidDate = (date) => DATE_REGEX.test(date);

// Helper for JayContract responses
const sendSuccess = (res, statusCode, data, message = '') => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

const sendError = (res, statusCode, message, errorCode = 'ERROR') => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errorCode
  });
};

// Date helper in UTC
const formatDateUTC = (d) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * GET /api/days/analytics/summary
 * Review weekly & monthly progress with week-over-week comparison
 */
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { date } = req.query;
    let refDate;

    if (date) {
      if (!isValidDate(date)) {
        return sendError(res, 400, 'Invalid date format. Expected YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
      }
      const [y, m, d] = date.split('-').map(Number);
      refDate = new Date(Date.UTC(y, m - 1, d));
    } else {
      const now = new Date();
      refDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const dayOfWeek = (refDate.getUTCDay() + 6) % 7; // 0 = Mon, 6 = Sun

    // Current Week bounds (Mon - Sun)
    const currMon = new Date(refDate);
    currMon.setUTCDate(refDate.getUTCDate() - dayOfWeek);
    const currSun = new Date(currMon);
    currSun.setUTCDate(currMon.getUTCDate() + 6);

    // Previous Week bounds (Mon - Sun)
    const prevMon = new Date(currMon);
    prevMon.setUTCDate(currMon.getUTCDate() - 7);
    const prevSun = new Date(currMon);
    prevSun.setUTCDate(currMon.getUTCDate() - 1);

    // Current Month bounds
    const year = refDate.getUTCFullYear();
    const month = refDate.getUTCMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthFirstDay = `${monthStr}-01`;
    const lastDayOfMonthNum = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthLastDay = `${monthStr}-${String(lastDayOfMonthNum).padStart(2, '0')}`;

    // Earliest and latest date needed for queries
    const earliestDate = formatDateUTC(prevMon) < monthFirstDay ? formatDateUTC(prevMon) : monthFirstDay;
    const latestDate = formatDateUTC(currSun) > monthLastDay ? formatDateUTC(currSun) : monthLastDay;

    const daysDocs = await Day.find({
      date: { $gte: earliestDate, $lte: latestDate }
    });

    const dayMap = new Map();
    daysDocs.forEach((doc) => {
      dayMap.set(doc.date, doc);
    });

    const weekDaysNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const buildWeekStats = (monDate) => {
      const days = [];
      let totalTasks = 0;
      let completedTasks = 0;

      for (let i = 0; i < 7; i++) {
        const d = new Date(monDate);
        d.setUTCDate(monDate.getUTCDate() + i);
        const dateString = formatDateUTC(d);
        const dayDoc = dayMap.get(dateString);
        const tasks = dayDoc && dayDoc.tasks ? dayDoc.tasks : [];
        const total = tasks.length;
        const completed = tasks.filter((t) => t.isCompleted).length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalTasks += total;
        completedTasks += completed;

        days.push({
          date: dateString,
          dayOfWeek: weekDaysNames[i],
          total,
          completed,
          rate
        });
      }

      const averageCompletion = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      return {
        startDate: days[0].date,
        endDate: days[6].date,
        averageCompletion,
        totalTasks,
        completedTasks,
        days
      };
    };

    const currentWeek = buildWeekStats(currMon);
    const previousWeek = buildWeekStats(prevMon);

    // Week-over-week comparison
    const weekDiff = currentWeek.averageCompletion - previousWeek.averageCompletion;
    let status = 'equal';
    let message = `Tiến độ duy trì đều đặn (bằng tuần trước, ${currentWeek.averageCompletion}%).`;

    if (weekDiff > 0) {
      status = 'better';
      message = `Tuyệt vời! Tuần này bạn hoàn thành tốt hơn tuần trước (+${weekDiff}%).`;
    } else if (weekDiff < 0) {
      status = 'lower';
      message = `Cần cố gắng hơn, tuần này thấp hơn tuần trước (${weekDiff}%).`;
    }

    const comparison = {
      weekDiff,
      status,
      message
    };

    // Monthly aggregation
    const monthDaysList = daysDocs.filter((d) => d.date.startsWith(monthStr));
    let monthTotalTasks = 0;
    let monthCompletedTasks = 0;
    let bestDay = null;

    const dailyStats = monthDaysList.map((doc) => {
      const total = doc.tasks.length;
      const completed = doc.tasks.filter((t) => t.isCompleted).length;
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

      monthTotalTasks += total;
      monthCompletedTasks += completed;

      if (total > 0 && (!bestDay || rate > bestDay.rate)) {
        bestDay = { date: doc.date, rate };
      }

      return {
        date: doc.date,
        total,
        completed,
        rate
      };
    });

    const monthAverageCompletion =
      monthTotalTasks === 0 ? 0 : Math.round((monthCompletedTasks / monthTotalTasks) * 100);

    const currentMonth = {
      month: monthStr,
      averageCompletion: monthAverageCompletion,
      totalTasks: monthTotalTasks,
      completedTasks: monthCompletedTasks,
      daysRecorded: monthDaysList.length,
      bestDay,
      dailyStats
    };

    return sendSuccess(
      res,
      200,
      {
        currentWeek,
        previousWeek,
        comparison,
        currentMonth
      },
      'Analytics summary retrieved successfully'
    );
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/days/:date
 * Retrieve tasks for a specific date
 */
exports.getDay = async (req, res) => {
  try {
    const { date } = req.params;

    if (!isValidDate(date)) {
      return sendError(res, 400, 'Invalid date format. Expected YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
    }

    const day = await Day.findOne({ date });
    if (!day) {
      return sendSuccess(res, 200, { date, tasks: [] }, 'No tasks found for date');
    }

    return sendSuccess(res, 200, day, 'Day retrieved successfully');
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * POST /api/days/:date/tasks
 * Add a new task to a specific date
 */
exports.addTask = async (req, res) => {
  try {
    const { date } = req.params;
    const { title } = req.body;

    if (!isValidDate(date)) {
      return sendError(res, 400, 'Invalid date format. Expected YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return sendError(res, 400, 'Task title cannot be empty.', 'VALIDATION_ERROR');
    }

    let day = await Day.findOne({ date });
    if (!day) {
      day = new Day({ date, tasks: [] });
    }

    day.tasks.push({
      title: title.trim(),
      isCompleted: false
    });

    await day.save();

    return sendSuccess(res, 201, day, 'Task added successfully');
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PATCH /api/days/:date/tasks/:taskId
 * Update or toggle a task
 */
exports.updateTask = async (req, res) => {
  try {
    const { date, taskId } = req.params;
    const { isCompleted, title } = req.body;

    if (!isValidDate(date)) {
      return sendError(res, 400, 'Invalid date format. Expected YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return sendError(res, 404, 'Invalid task ID.', 'NOT_FOUND');
    }

    const day = await Day.findOne({ date });
    if (!day) {
      return sendError(res, 404, 'Day not found.', 'NOT_FOUND');
    }

    const task = day.tasks.id(taskId);
    if (!task) {
      return sendError(res, 404, 'Task not found in specified day.', 'NOT_FOUND');
    }

    if (isCompleted !== undefined) {
      task.isCompleted = Boolean(isCompleted);
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return sendError(res, 400, 'Task title cannot be empty.', 'VALIDATION_ERROR');
      }
      task.title = title.trim();
    }

    await day.save();

    return sendSuccess(res, 200, day, 'Task updated successfully');
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * DELETE /api/days/:date/tasks/:taskId
 * Remove a task from a specific date
 */
exports.deleteTask = async (req, res) => {
  try {
    const { date, taskId } = req.params;

    if (!isValidDate(date)) {
      return sendError(res, 400, 'Invalid date format. Expected YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return sendError(res, 404, 'Invalid task ID.', 'NOT_FOUND');
    }

    const day = await Day.findOne({ date });
    if (!day) {
      return sendError(res, 404, 'Day not found.', 'NOT_FOUND');
    }

    const task = day.tasks.id(taskId);
    if (!task) {
      return sendError(res, 404, 'Task not found.', 'NOT_FOUND');
    }

    day.tasks.pull(taskId);
    await day.save();

    return sendSuccess(res, 200, day, 'Task deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/days
 * Retrieve all days sorted by date ascending
 */
exports.getAllDays = async (req, res) => {
  try {
    const days = await Day.find({}).sort({ date: 1 });
    return sendSuccess(res, 200, days, 'All days retrieved successfully');
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};


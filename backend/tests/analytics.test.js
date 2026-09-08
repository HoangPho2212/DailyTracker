const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../app');
const Day = require('../models/Day');

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/dailytracker_test';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_MONGO_URI);
});

beforeEach(async () => {
  await Day.deleteMany({});
});

afterAll(async () => {
  await Day.deleteMany({});
  await mongoose.connection.close();
});

describe('Analytics & Review API Contracts', () => {
  describe('GET /api/days/analytics/summary', () => {
    it('computes week-over-week comparison and monthly metrics accurately', async () => {
      // Setup previous week (Monday 2026-08-31 to Sunday 2026-09-06)
      await Day.create({
        date: '2026-09-01',
        tasks: [
          { title: 'Task P1', isCompleted: true },
          { title: 'Task P2', isCompleted: false }
        ] // 1/2 = 50%
      });

      await Day.create({
        date: '2026-09-02',
        tasks: [
          { title: 'Task P3', isCompleted: true },
          { title: 'Task P4', isCompleted: false }
        ] // 1/2 = 50%
      });

      // Setup current week (Monday 2026-09-07 to Sunday 2026-09-13)
      await Day.create({
        date: '2026-09-07',
        tasks: [
          { title: 'Task C1', isCompleted: true },
          { title: 'Task C2', isCompleted: true },
          { title: 'Task C3', isCompleted: true },
          { title: 'Task C4', isCompleted: false }
        ] // 3/4 = 75%
      });

      await Day.create({
        date: '2026-09-08',
        tasks: [
          { title: 'Task C5', isCompleted: true },
          { title: 'Task C6', isCompleted: true },
          { title: 'Task C7', isCompleted: true },
          { title: 'Task C8', isCompleted: false }
        ] // 3/4 = 75%
      });

      const res = await request(app).get('/api/days/analytics/summary?date=2026-09-08');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { currentWeek, previousWeek, comparison, currentMonth } = res.body.data;

      // Current week metrics
      expect(currentWeek.startDate).toBe('2026-09-07');
      expect(currentWeek.endDate).toBe('2026-09-13');
      expect(currentWeek.totalTasks).toBe(8);
      expect(currentWeek.completedTasks).toBe(6);
      expect(currentWeek.averageCompletion).toBe(75);
      expect(currentWeek.days).toHaveLength(7);

      // Verify specific day in current week
      const sep08 = currentWeek.days.find(d => d.date === '2026-09-08');
      expect(sep08.rate).toBe(75);
      expect(sep08.total).toBe(4);
      expect(sep08.completed).toBe(3);

      // Previous week metrics
      expect(previousWeek.startDate).toBe('2026-08-31');
      expect(previousWeek.endDate).toBe('2026-09-06');
      expect(previousWeek.totalTasks).toBe(4);
      expect(previousWeek.completedTasks).toBe(2);
      expect(previousWeek.averageCompletion).toBe(50);

      // Week-over-week comparison (75% vs 50% => +25%)
      expect(comparison.weekDiff).toBe(25);
      expect(comparison.status).toBe('better');
      expect(comparison.message).toContain('+25%');

      // Month metrics (September 2026)
      expect(currentMonth.month).toBe('2026-09');
      expect(currentMonth.totalTasks).toBe(12);
      expect(currentMonth.completedTasks).toBe(8);
      expect(currentMonth.averageCompletion).toBe(67); // Math.round(8/12 * 100) = 67%
    });

    it('handles empty database gracefully with 0% rates and equal status', async () => {
      const res = await request(app).get('/api/days/analytics/summary?date=2026-09-08');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentWeek.averageCompletion).toBe(0);
      expect(res.body.data.previousWeek.averageCompletion).toBe(0);
      expect(res.body.data.comparison.weekDiff).toBe(0);
      expect(res.body.data.comparison.status).toBe('equal');
    });

    it('rejects invalid date query string with 400', async () => {
      const res = await request(app).get('/api/days/analytics/summary?date=bad-date');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_DATE_FORMAT');
    });
  });
});

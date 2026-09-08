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

describe('404 Error Handling & Collection Route Contracts', () => {
  describe('GET /api/days', () => {
    it('returns 200 with all days list in JayContract format', async () => {
      await Day.create({
        date: '2026-09-08',
        tasks: [{ title: 'Task 1', isCompleted: true }]
      });

      const res = await request(app).get('/api/days');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].date).toBe('2026-09-08');
    });
  });

  describe('404 Route Not Found Middleware', () => {
    it('returns standardized 404 JayContract JSON for non-existent GET route', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ROUTE_NOT_FOUND');
      expect(res.body.message).toContain('/api/non-existent-endpoint');
    });

    it('returns standardized 404 JayContract JSON for non-existent POST route', async () => {
      const res = await request(app).post('/random-endpoint').send({});
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ROUTE_NOT_FOUND');
    });
  });
});

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

describe('Day & Task API Contracts (JayContract)', () => {
  describe('GET /api/days/:date', () => {
    it('returns empty task list in JayContract format for non-existing date', async () => {
      const res = await request(app).get('/api/days/2026-09-08');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        date: '2026-09-08',
        tasks: []
      });
    });

    it('rejects invalid date format with 400 and JayContract validation error', async () => {
      const res = await request(app).get('/api/days/invalid-date');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_DATE_FORMAT');
    });
  });

  describe('POST /api/days/:date/tasks', () => {
    it('creates a new day with task if day does not exist', async () => {
      const res = await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'Complete TDD backend tests' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe('2026-09-08');
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].title).toBe('Complete TDD backend tests');
      expect(res.body.data.tasks[0].isCompleted).toBe(false);
      expect(res.body.data.tasks[0]._id).toBeDefined();
    });

    it('appends tasks to an existing day', async () => {
      await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'First task' });

      const res = await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'Second task' });

      expect(res.status).toBe(201);
      expect(res.body.data.tasks).toHaveLength(2);
      expect(res.body.data.tasks[1].title).toBe('Second task');
    });

    it('rejects empty or whitespace-only task title', async () => {
      const res = await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/days/:date/tasks/:taskId', () => {
    it('toggles task completion status', async () => {
      const createRes = await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'Toggle test task' });

      const taskId = createRes.body.data.tasks[0]._id;

      const toggleRes = await request(app)
        .patch(`/api/days/2026-09-08/tasks/${taskId}`)
        .send({ isCompleted: true });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.success).toBe(true);
      expect(toggleRes.body.data.tasks[0].isCompleted).toBe(true);

      const untoggleRes = await request(app)
        .patch(`/api/days/2026-09-08/tasks/${taskId}`)
        .send({ isCompleted: false });

      expect(untoggleRes.status).toBe(200);
      expect(untoggleRes.body.data.tasks[0].isCompleted).toBe(false);
    });

    it('updates task title if provided', async () => {
      const createRes = await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'Initial Title' });

      const taskId = createRes.body.data.tasks[0]._id;

      const updateRes = await request(app)
        .patch(`/api/days/2026-09-08/tasks/${taskId}`)
        .send({ title: 'Updated Title' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.tasks[0].title).toBe('Updated Title');
    });

    it('returns 404 for non-existent task id', async () => {
      await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'Existing Task' });

      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/days/2026-09-08/tasks/${fakeId}`)
        .send({ isCompleted: true });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/days/:date/tasks/:taskId', () => {
    it('deletes a task by id from a day', async () => {
      const createRes = await request(app)
        .post('/api/days/2026-09-08/tasks')
        .send({ title: 'To be deleted' });

      const taskId = createRes.body.data.tasks[0]._id;

      const deleteRes = await request(app)
        .delete(`/api/days/2026-09-08/tasks/${taskId}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.tasks).toHaveLength(0);

      // Verify persistence via GET
      const getRes = await request(app).get('/api/days/2026-09-08');
      expect(getRes.body.data.tasks).toHaveLength(0);
    });

    it('returns 404 when deleting from non-existent day', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/days/2026-09-08/tasks/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

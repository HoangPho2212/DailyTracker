const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../app');
const User = require('../models/User');
const Day = require('../models/Day');

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/dailytracker_test';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_MONGO_URI);
  await Day.syncIndexes();
  await User.syncIndexes();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Day.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Day.deleteMany({});
  await mongoose.connection.close();
});

describe('Authentication & User Isolation Contracts (JayContract)', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns JWT token in JayContract', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.id).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
    });

    it('rejects duplicate username registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'uniqueuser', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'uniqueuser', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('DUPLICATE_USERNAME');
    });

    it('rejects short passwords (< 6 characters)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validuser', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'loginuser', password: 'secretpassword' });
    });

    it('logs in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'secretpassword' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe('loginuser');
    });

    it('rejects incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('rejects non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'secretpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Multi-User Data Isolation', () => {
    it('isolates task records between two different users on the same date', async () => {
      // Register User 1
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user1', password: 'password123' });
      const token1 = res1.body.data.token;

      // Register User 2
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user2', password: 'password123' });
      const token2 = res2.body.data.token;

      // User 1 adds task on 2026-09-09
      await request(app)
        .post('/api/days/2026-09-09/tasks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Task of User 1' });

      // User 2 adds task on 2026-09-09
      await request(app)
        .post('/api/days/2026-09-09/tasks')
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Task of User 2' });

      // Verify User 1 sees only their task
      const get1 = await request(app)
        .get('/api/days/2026-09-09')
        .set('Authorization', `Bearer ${token1}`);

      expect(get1.status).toBe(200);
      expect(get1.body.data.tasks).toHaveLength(1);
      expect(get1.body.data.tasks[0].title).toBe('Task of User 1');

      // Verify User 2 sees only their task
      const get2 = await request(app)
        .get('/api/days/2026-09-09')
        .set('Authorization', `Bearer ${token2}`);

      expect(get2.status).toBe(200);
      expect(get2.body.data.tasks).toHaveLength(1);
      expect(get2.body.data.tasks[0].title).toBe('Task of User 2');
    });

    it('rejects unauthenticated requests to protected day routes with 401', async () => {
      const res = await request(app).get('/api/days/2026-09-09');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });
  });
});

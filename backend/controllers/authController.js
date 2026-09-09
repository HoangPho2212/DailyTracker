const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Day = require('../models/Day');

const JWT_SECRET = process.env.JWT_SECRET || 'dailytracker_jwt_secret_key_2026';

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

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString(), username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return sendError(res, 400, 'Username is required.', 'VALIDATION_ERROR');
    }

    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return sendError(res, 400, 'Username must be between 3 and 30 characters.', 'VALIDATION_ERROR');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.', 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return sendError(res, 400, 'Username is already taken.', 'DUPLICATE_USERNAME');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: cleanUsername,
      password: hashedPassword
    });

    // Auto-claim any unassigned days for the first user (preserves mock data)
    await Day.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: user._id } }
    );

    const token = generateToken(user);

    return sendSuccess(
      res,
      201,
      {
        user: {
          id: user._id,
          username: user.username
        },
        token
      },
      'User registered successfully'
    );
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 400, 'Username and password are required.', 'VALIDATION_ERROR');
    }

    const cleanUsername = username.toLowerCase().trim();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return sendError(res, 401, 'Invalid username or password.', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid username or password.', 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user);

    return sendSuccess(
      res,
      200,
      {
        user: {
          id: user._id,
          username: user.username
        },
        token
      },
      'User logged in successfully'
    );
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return sendError(res, 404, 'User not found.', 'NOT_FOUND');
    }

    return sendSuccess(
      res,
      200,
      {
        id: user._id,
        username: user.username
      },
      'User profile retrieved'
    );
  } catch (error) {
    return sendError(res, 500, error.message, 'INTERNAL_SERVER_ERROR');
  }
};

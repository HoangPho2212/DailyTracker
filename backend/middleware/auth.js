const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dailytracker_jwt_secret_key_2026';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Access denied. Authentication token required.',
      errorCode: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, username }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired authentication token.',
      errorCode: 'UNAUTHORIZED'
    });
  }
};

module.exports = authMiddleware;

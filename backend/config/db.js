const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dailytracker';
    await mongoose.connect(mongoUri);
    const Day = require('../models/Day');
    const User = require('../models/User');
    await Promise.all([Day.syncIndexes(), User.syncIndexes()]);
    console.log(`✅ MongoDB connected successfully: ${mongoUri}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

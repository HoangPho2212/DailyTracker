const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const DaySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  date: {
    type: String,
    required: [true, 'Date is required in YYYY-MM-DD format'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Please provide a valid date format (YYYY-MM-DD)']
  },
  tasks: [TaskSchema]
}, { timestamps: true });

// Compound unique index so each user has their own unique date record
DaySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Day', DaySchema);

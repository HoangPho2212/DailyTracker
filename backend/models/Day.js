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
  date: {
    type: String,
    required: [true, 'Date is required in YYYY-MM-DD format'],
    unique: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Please provide a valid date format (YYYY-MM-DD)']
  },
  tasks: [TaskSchema]
}, { timestamps: true });

module.exports = mongoose.model('Day', DaySchema);

const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  averageRewardPoints: {
    type: Number,
    default: 0
  },
  averageAttendance: {
    type: Number,
    default: 0
  },
  averageCGPA: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  atRiskStudents: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for uniqueness
classSchema.index({ department: 1, batch: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
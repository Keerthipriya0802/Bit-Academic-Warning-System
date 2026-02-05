const mongoose = require('mongoose');

const semesterPerformanceSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true
  },
  riskScore: {
    type: Number,
    default: 0
  },
  warningLevel: {
    type: String,
    enum: ['Safe', 'Mild Warning', 'Moderate Warning', 'Severe Academic Warning'],
    default: 'Safe'
  },
  issues: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const studentAcademicSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Academic Data Fields
  attendancePercentage: {
    type: Number,
    required: true,
    default: 100,
    min: 0,
    max: 100
  },
  periodicalTestMarks: {
    type: Number,
    required: true,
    default: 50,
    min: 0,
    max: 50
  },
  standingArrears: {
    type: Boolean,
    default: false
  },
  skillLevel: {
    type: Number,
    required: true,
    default: 8,
    min: 1,
    max: 10
  },
  cgpa: {
    type: Number,
    required: true,
    default: 8.0,
    min: 0,
    max: 10
  },
  disciplineComplaints: {
    type: Number,
    default: 0,
    min: 0
  },
  projectsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  activityPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  rewardPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  certificationsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  achievementsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Risk Analysis Results
  currentRiskScore: {
    type: Number,
    default: 0
  },
  currentWarningLevel: {
    type: String,
    enum: ['Safe', 'Mild Warning', 'Moderate Warning', 'Severe Academic Warning'],
    default: 'Safe'
  },
  failedParameters: [String],
  suggestedActions: [String],
  // Historical Data
  semesterPerformance: [semesterPerformanceSchema],
  continuousPoorSemesters: {
    type: Number,
    default: 0
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
studentAcademicSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentAcademic', studentAcademicSchema);
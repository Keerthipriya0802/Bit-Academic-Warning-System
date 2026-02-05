const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const StudentAcademic = require('../models/StudentAcademic');
const User = require('../models/User');
const riskAnalyzer = require('../utils/riskAnalyzer');

// GET STUDENT'S OWN ACADEMIC DATA
router.get('/my-data', auth('student'), async (req, res) => {
  try {
    const academicData = await StudentAcademic.findOne({ 
      studentId: req.userId 
    }).populate('studentId', 'name email studentId department batch semester');

    if (!academicData) {
      return res.status(404).json({ 
        error: 'Academic data not found' 
      });
    }

    res.json({
      message: 'Academic data retrieved successfully',
      data: academicData
    });
  } catch (error) {
    console.error('Get student data error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve academic data' 
    });
  }
});

// GET STUDENT'S RISK ANALYSIS
router.get('/my-risk-analysis', auth('student'), async (req, res) => {
  try {
    const academicData = await StudentAcademic.findOne({ 
      studentId: req.userId 
    });

    if (!academicData) {
      return res.status(404).json({ 
        error: 'Academic data not found' 
      });
    }

    const analysis = await riskAnalyzer.analyzeStudent(
      academicData._id, 
      req.user
    );

    res.json({
      message: 'Risk analysis completed',
      analysis
    });
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to perform risk analysis' 
    });
  }
});

// UPDATE STUDENT'S ACADEMIC DATA
router.put('/update-data', auth('student'), async (req, res) => {
  try {
    const {
      attendancePercentage,
      periodicalTestMarks,
      standingArrears,
      skillLevel,
      cgpa,
      disciplineComplaints,
      projectsCompleted,
      activityPoints,
      rewardPoints,
      certificationsCount,
      achievementsCount
    } = req.body;

    // Validate data
    const updates = {};
    
    if (attendancePercentage !== undefined) {
      if (attendancePercentage < 0 || attendancePercentage > 100) {
        return res.status(400).json({ 
          error: 'Attendance percentage must be between 0 and 100' 
        });
      }
      updates.attendancePercentage = attendancePercentage;
    }

    if (periodicalTestMarks !== undefined) {
      if (periodicalTestMarks < 0 || periodicalTestMarks > 50) {
        return res.status(400).json({ 
          error: 'Test marks must be between 0 and 50' 
        });
      }
      updates.periodicalTestMarks = periodicalTestMarks;
    }

    if (standingArrears !== undefined) {
      updates.standingArrears = Boolean(standingArrears);
    }

    if (skillLevel !== undefined) {
      if (skillLevel < 1 || skillLevel > 10) {
        return res.status(400).json({ 
          error: 'Skill level must be between 1 and 10' 
        });
      }
      updates.skillLevel = skillLevel;
    }

    if (cgpa !== undefined) {
      if (cgpa < 0 || cgpa > 10) {
        return res.status(400).json({ 
          error: 'CGPA must be between 0 and 10' 
        });
      }
      updates.cgpa = cgpa;
    }

    if (disciplineComplaints !== undefined) {
      updates.disciplineComplaints = Math.max(0, disciplineComplaints);
    }

    if (projectsCompleted !== undefined) {
      updates.projectsCompleted = Math.max(0, projectsCompleted);
    }

    if (activityPoints !== undefined) {
      updates.activityPoints = Math.max(0, activityPoints);
    }

    if (rewardPoints !== undefined) {
      updates.rewardPoints = Math.max(0, rewardPoints);
    }

    if (certificationsCount !== undefined) {
      updates.certificationsCount = Math.max(0, certificationsCount);
    }

    if (achievementsCount !== undefined) {
      updates.achievementsCount = Math.max(0, achievementsCount);
    }

    // Update academic data
    const academicData = await StudentAcademic.findOneAndUpdate(
      { studentId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!academicData) {
      return res.status(404).json({ 
        error: 'Academic data not found' 
      });
    }

    // Perform new risk analysis after update
    const analysis = await riskAnalyzer.analyzeStudent(
      academicData._id, 
      req.user
    );

    res.json({
      message: 'Academic data updated successfully',
      data: academicData,
      analysis
    });
  } catch (error) {
    console.error('Update academic data error:', error);
    res.status(500).json({ 
      error: 'Failed to update academic data' 
    });
  }
});

// GET STUDENT'S PERFORMANCE HISTORY
router.get('/performance-history', auth('student'), async (req, res) => {
  try {
    const academicData = await StudentAcademic.findOne({ 
      studentId: req.userId 
    }).select('semesterPerformance currentWarningLevel currentRiskScore');

    if (!academicData) {
      return res.status(404).json({ 
        error: 'Academic data not found' 
      });
    }

    res.json({
      message: 'Performance history retrieved',
      history: academicData.semesterPerformance,
      currentStatus: {
        warningLevel: academicData.currentWarningLevel,
        riskScore: academicData.currentRiskScore
      }
    });
  } catch (error) {
    console.error('Get performance history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve performance history' 
    });
  }
});

// GET SUGGESTED ACTIONS
router.get('/suggestions', auth('student'), async (req, res) => {
  try {
    const academicData = await StudentAcademic.findOne({ 
      studentId: req.userId 
    }).select('suggestedActions failedParameters');

    if (!academicData) {
      return res.status(404).json({ 
        error: 'Academic data not found' 
      });
    }

    res.json({
      message: 'Suggested actions retrieved',
      suggestions: academicData.suggestedActions || [],
      issues: academicData.failedParameters || []
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve suggestions' 
    });
  }
});

module.exports = router;
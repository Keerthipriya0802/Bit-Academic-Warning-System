const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const StudentAcademic = require('../models/StudentAcademic');
const User = require('../models/User');
const Class = require('../models/Class');
const riskAnalyzer = require('../utils/riskAnalyzer');

// GET ALL STUDENTS (Staff View)
router.get('/students', auth('staff', 'admin'), async (req, res) => {
  try {
    const { department, batch, semester, warningLevel } = req.query;
    
    let query = {};
    
    // Build query based on staff's department
    if (req.user.role === 'staff') {
      query['studentId.department'] = req.user.department;
    }
    
    if (department) {
      query['studentId.department'] = department;
    }
    
    if (batch) {
      query['studentId.batch'] = batch;
    }
    
    if (semester) {
      query['studentId.semester'] = parseInt(semester);
    }
    
    if (warningLevel) {
      query.currentWarningLevel = warningLevel;
    }
    
    const students = await StudentAcademic.find()
      .populate({
        path: 'studentId',
        match: query,
        select: 'name email studentId department batch semester'
      })
      .exec();
    
    const validStudents = students.filter(s => s.studentId);
    
    res.json({
      message: 'Students retrieved successfully',
      count: validStudents.length,
      students: validStudents
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve students' 
    });
  }
});

// GET AT-RISK STUDENTS
router.get('/at-risk-students', auth('staff', 'admin'), async (req, res) => {
  try {
    const { department, batch, semester } = req.query;
    
    let query = { currentWarningLevel: { $ne: 'Safe' } };
    
    if (req.user.role === 'staff') {
      query['studentId.department'] = req.user.department;
    }
    
    if (department) {
      query['studentId.department'] = department;
    }
    
    if (batch) {
      query['studentId.batch'] = batch;
    }
    
    if (semester) {
      query['studentId.semester'] = parseInt(semester);
    }
    
    const students = await StudentAcademic.find(query)
      .populate({
        path: 'studentId',
        select: 'name email studentId department batch semester'
      })
      .sort({ currentRiskScore: -1 })
      .exec();
    
    // Group by warning level
    const grouped = {
      severe: students.filter(s => s.currentWarningLevel === 'Severe Academic Warning'),
      moderate: students.filter(s => s.currentWarningLevel === 'Moderate Warning'),
      mild: students.filter(s => s.currentWarningLevel === 'Mild Warning')
    };
    
    res.json({
      message: 'At-risk students retrieved',
      total: students.length,
      grouped,
      summary: {
        severe: grouped.severe.length,
        moderate: grouped.moderate.length,
        mild: grouped.mild.length
      }
    });
  } catch (error) {
    console.error('Get at-risk students error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve at-risk students' 
    });
  }
});

// GET STUDENT DETAILS
router.get('/student/:id', auth('staff', 'admin'), async (req, res) => {
  try {
    const student = await StudentAcademic.findOne({ 
      studentId: req.params.id 
    })
    .populate('studentId', 'name email studentId department batch semester');
    
    if (!student) {
      return res.status(404).json({ 
        error: 'Student not found' 
      });
    }
    
    // Check if staff has access to this department
    if (req.user.role === 'staff' && 
        student.studentId.department !== req.user.department) {
      return res.status(403).json({ 
        error: 'Access denied to this department' 
      });
    }
    
    const analysis = await riskAnalyzer.analyzeStudent(
      student._id, 
      student.studentId
    );
    
    res.json({
      message: 'Student details retrieved',
      student,
      analysis
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve student details' 
    });
  }
});

// UPDATE STUDENT ACADEMIC DATA (Staff)
router.put('/student/:id/update', auth('staff', 'admin'), async (req, res) => {
  try {
    const student = await StudentAcademic.findOne({ 
      studentId: req.params.id 
    }).populate('studentId');
    
    if (!student) {
      return res.status(404).json({ 
        error: 'Student not found' 
      });
    }
    
    // Check department access
    if (req.user.role === 'staff' && 
        student.studentId.department !== req.user.department) {
      return res.status(403).json({ 
        error: 'Access denied to this department' 
      });
    }
    
    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (student[key] !== undefined) {
        student[key] = updates[key];
      }
    });
    
    await student.save();
    
    // Perform new analysis
    const analysis = await riskAnalyzer.analyzeStudent(
      student._id, 
      student.studentId
    );
    
    res.json({
      message: 'Student data updated successfully',
      student,
      analysis
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      error: 'Failed to update student data' 
    });
  }
});

// ANALYZE ENTIRE CLASS
router.post('/analyze-class', auth('staff', 'admin'), async (req, res) => {
  try {
    const { department, batch, semester } = req.body;
    
    const dept = department || req.user.department;
    
    if (!dept || !batch || !semester) {
      return res.status(400).json({ 
        error: 'Department, batch, and semester are required' 
      });
    }
    
    const results = await riskAnalyzer.analyzeClass(dept, batch, semester);
    
    res.json({
      message: 'Class analysis completed',
      department: dept,
      batch,
      semester,
      totalStudents: results.length,
      results
    });
  } catch (error) {
    console.error('Analyze class error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze class' 
    });
  }
});

// GET CLASS STATISTICS
router.get('/class-stats', auth('staff', 'admin'), async (req, res) => {
  try {
    const { department, batch, semester } = req.query;
    
    const dept = department || req.user.department;
    
    if (!dept) {
      return res.status(400).json({ 
        error: 'Department is required' 
      });
    }
    
    const query = { department: dept };
    if (batch) query.batch = batch;
    if (semester) query.semester = parseInt(semester);
    
    const classStats = await Class.find(query).sort({ batch: -1, semester: -1 });
    
    res.json({
      message: 'Class statistics retrieved',
      stats: classStats
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve class statistics' 
    });
  }
});

// GENERATE REPORT
router.get('/generate-report', auth('staff', 'admin'), async (req, res) => {
  try {
    const { department, batch, semester, format = 'json' } = req.query;
    
    const dept = department || req.user.department;
    
    // Get all students in the class
    const students = await StudentAcademic.find()
      .populate({
        path: 'studentId',
        match: { 
          department: dept,
          ...(batch && { batch }),
          ...(semester && { semester: parseInt(semester) })
        },
        select: 'name studentId batch semester'
      })
      .exec();
    
    const validStudents = students.filter(s => s.studentId);
    
    // Prepare report data
    const report = {
      generatedAt: new Date().toISOString(),
      department: dept,
      batch,
      semester,
      totalStudents: validStudents.length,
      atRiskCount: validStudents.filter(s => s.currentWarningLevel !== 'Safe').length,
      students: validStudents.map(student => ({
        name: student.studentId.name,
        studentId: student.studentId.studentId,
        warningLevel: student.currentWarningLevel,
        riskScore: student.currentRiskScore,
        issues: student.failedParameters || [],
        suggestions: student.suggestedActions || []
      }))
    };
    
    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = ['Name', 'Student ID', 'Warning Level', 'Risk Score', 'Issues', 'Suggestions'];
      const csvRows = report.students.map(s => [
        s.name,
        s.studentId,
        s.warningLevel,
        s.riskScore,
        s.issues.join('; '),
        s.suggestions.join('; ')
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`academic-report-${dept}-${Date.now()}.csv`);
      return res.send(csvContent);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report' 
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentAcademic = require('../models/StudentAcademic');
const { registerValidator, emailValidator } = require('../middleware/emailValidator');
const validate = require('../middleware/validate');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate IDs
const generateStudentId = (batch, dept) => {
  const year = batch.slice(-2);
  const deptCode = dept.substring(0, 2).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BIT${year}${deptCode}${random}`;
};

const generateStaffId = () => {
  return `STAFF${Date.now().toString().slice(-6)}`;
};

// REGISTER
router.post('/register', registerValidator, validate, async (req, res) => {
  try {
    const { email, password, name, department, role, batch, semester } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }
    
    // Generate IDs based on role
    let studentId, staffId;
    
    if (role === 'student') {
      studentId = generateStudentId(batch, department);
    } else {
      staffId = generateStaffId();
    }
    
    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      department,
      role,
      studentId: role === 'student' ? studentId : undefined,
      staffId: role !== 'student' ? staffId : undefined,
      batch: role === 'student' ? batch : undefined,
      semester: role === 'student' ? semester : undefined,
      emailVerified: true // For now, skip email verification
    });
    
    await user.save();
    
    // If student, create academic record
    if (role === 'student') {
      const academicRecord = new StudentAcademic({
        studentId: user._id
      });
      await academicRecord.save();
    }
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// LOGIN
router.post('/login', emailValidator, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Contact administrator.' 
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed' 
    });
  }
});

// GET CURRENT USER
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with academic data if student
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    let response = { user: user.toJSON() };
    
    // If student, include academic data
    if (user.role === 'student') {
      const academicData = await StudentAcademic.findOne({ studentId: user._id });
      response.academicData = academicData || null;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  // JWT is stateless, so logout is client-side
  res.json({ 
    message: 'Logged out successfully' 
  });
});

module.exports = router;
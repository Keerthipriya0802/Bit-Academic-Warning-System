const { body } = require('express-validator');

const emailValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      if (!value.endsWith('@bitsathy.ac.in')) {
        throw new Error('Only @bitsathy.ac.in email addresses are allowed');
      }
      return true;
    })
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const registerValidator = [
  ...emailValidator,
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isIn([
      'Information Technology',
      'Computer Science',
      'Electronics and Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Artificial Intelligence',
      'Computer Technology'
    ])
    .withMessage('Invalid department'),
  
  body('role')
    .isIn(['student', 'staff', 'admin'])
    .withMessage('Invalid role'),
  
  body('batch')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Batch is required for students')
    .matches(/^20\d{2}$/)
    .withMessage('Batch must be in format YYYY (e.g., 2023)'),
  
  body('semester')
    .if(body('role').equals('student'))
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
];

module.exports = { emailValidator, registerValidator };
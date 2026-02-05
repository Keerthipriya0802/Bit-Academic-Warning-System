const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v.endsWith('@bitsathy.ac.in');
      },
      message: 'Only @bitsathy.ac.in emails are allowed'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Information Technology',
      'Computer Science',
      'Electronics and Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Artificial Intelligence',
      'Computer Technology'
    ]
  },
  studentId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true
  },
  staffId: {
    type: String,
    required: function() {
      return this.role === 'staff' || this.role === 'admin';
    },
    unique: true,
    sparse: true
  },
  batch: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  semester: {
    type: Number,
    default: 1,
    min: 1,
    max: 8
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
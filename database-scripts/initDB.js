const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const departments = [
  'Information Technology',
  'Computer Science',
  'Electronics and Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence',
  'Computer Technology'
];

const testUsers = [
  // Admin
  {
    email: 'admin@bitsathy.ac.in',
    password: 'Admin@123',
    name: 'System Administrator',
    department: 'Information Technology',
    role: 'admin',
    staffId: 'ADMIN001'
  },
  // Staff
  {
    email: 'staff.it@bitsathy.ac.in',
    password: 'Staff@123',
    name: 'IT Department Staff',
    department: 'Information Technology',
    role: 'staff',
    staffId: 'STAFF001'
  },
  // Students
  {
    email: 'keerthipriya.it23@bitsathy.ac.in',
    password: 'Student@123',
    name: 'Keerthi Priya',
    department: 'Information Technology',
    role: 'student',
    batch: '2023',
    semester: 3,
    studentId: 'BIT23IT1001'
  },
  {
    email: 'arun.cs23@bitsathy.ac.in',
    password: 'Student@123',
    name: 'Arun Kumar',
    department: 'Computer Science',
    role: 'student',
    batch: '2023',
    semester: 3,
    studentId: 'BIT23CS1002'
  }
];

const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Clear existing data (optional)
    const User = require('../backend/models/User');
    const StudentAcademic = require('../backend/models/StudentAcademic');
    
    await User.deleteMany({});
    await StudentAcademic.deleteMany({});
    
    console.log('🗑️  Cleared existing data');
    
    // Create test users
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created ${user.role}: ${user.email}`);
      
      // Create academic record for students
      if (user.role === 'student') {
        const academic = new StudentAcademic({
          studentId: user._id,
          attendancePercentage: Math.floor(Math.random() * 30) + 70, // 70-100%
          periodicalTestMarks: Math.floor(Math.random() * 30) + 20, // 20-50
          cgpa: (Math.random() * 3) + 6, // 6-9
          skillLevel: Math.floor(Math.random() * 5) + 5, // 5-10
          projectsCompleted: Math.floor(Math.random() * 3),
          certificationsCount: Math.floor(Math.random() * 2),
          activityPoints: Math.floor(Math.random() * 3000) + 2000, // 2000-5000
          rewardPoints: Math.floor(Math.random() * 500) + 500 // 500-1000
        });
        await academic.save();
        console.log(`📊 Created academic record for ${user.name}`);
      }
    }
    
    console.log('\n🎉 Database Initialization Complete!');
    console.log('\n🔐 Test Credentials:');
    console.log('====================');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
    
    console.log('\n🌐 Your Application URLs:');
    console.log('Frontend: https://academic-warning.vercel.app');
    console.log('Backend API: https://academic-warning-api.onrender.com/api');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();
import React, { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const StaffDashboard = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsData, statsData] = await Promise.all([
        staffAPI.getAllStudents({ department: user.department }),
        staffAPI.getClassStats({ department: user.department })
      ]);
      
      setStudents(studentsData.students);
      setStats(statsData.stats[0]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarningColor = (level) => {
    switch (level) {
      case 'Safe': return 'bg-green-100 text-green-800';
      case 'Mild Warning': return 'bg-yellow-100 text-yellow-800';
      case 'Moderate Warning': return 'bg-orange-100 text-orange-800';
      case 'Severe Academic Warning': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name} ({user?.department})</p>
          </div>
          <button 
            onClick={() => staffAPI.analyzeClass({ 
              department: user.department, 
              batch: '2023', 
              semester: 3 
            })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Analyze Class
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600">Total Students</p>
          <p className="text-3xl font-bold text-gray-800">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600">At Risk Students</p>
          <p className="text-3xl font-bold text-red-600">
            {students.filter(s => s.currentWarningLevel !== 'Safe').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600">Average Risk Score</p>
          <p className="text-3xl font-bold text-orange-600">
            {Math.round(students.reduce((acc, s) => acc + s.currentRiskScore, 0) / students.length) || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600">Class Average CGPA</p>
          <p className="text-3xl font-bold text-green-600">{stats?.averageCGPA?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Student List</h2>
          <p className="text-gray-600">Click on a student to view details</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warning Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr 
                  key={student._id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.studentId?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.studentId?.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.studentId?.department}</div>
                    <div className="text-sm text-gray-500">
                      Batch {student.studentId?.batch} - Sem {student.studentId?.semester}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.currentRiskScore > 12 ? 'bg-red-100 text-red-800' :
                      student.currentRiskScore > 7 ? 'bg-orange-100 text-orange-800' :
                      student.currentRiskScore > 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {student.currentRiskScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getWarningColor(student.currentWarningLevel)}`}>
                      {student.currentWarningLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // View student details
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Update student data
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.studentId?.name}</h2>
                  <p className="text-gray-600">{selectedStudent.studentId?.studentId}</p>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Data</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attendance:</span>
                      <span className="font-medium">{selectedStudent.attendancePercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Test Marks:</span>
                      <span className="font-medium">{selectedStudent.periodicalTestMarks}/50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGPA:</span>
                      <span className="font-medium">{selectedStudent.cgpa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skill Level:</span>
                      <span className="font-medium">{selectedStudent.skillLevel}/10</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Issues</h3>
                  <div className="space-y-2">
                    {selectedStudent.failedParameters?.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700">{issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
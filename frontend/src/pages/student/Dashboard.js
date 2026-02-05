import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard = () => {
  const [academicData, setAcademicData] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [data, analysis] = await Promise.all([
        studentAPI.getMyData(),
        studentAPI.getMyRiskAnalysis()
      ]);
      
      setAcademicData(data.data);
      setRiskAnalysis(analysis.analysis);
    } catch (error) {
      console.error('Failed to load data:', error);
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
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-medium ${getWarningColor(riskAnalysis?.warningLevel)}`}>
            {riskAnalysis?.warningLevel || 'Safe'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Risk Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Score Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Risk Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className="text-3xl font-bold text-blue-600">{riskAnalysis?.riskScore || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Warning Level</p>
                <p className="text-2xl font-bold text-green-600">{riskAnalysis?.warningLevel || 'Safe'}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Issues Found</p>
                <p className="text-3xl font-bold text-yellow-600">{riskAnalysis?.failedParameters?.length || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Suggestions</p>
                <p className="text-3xl font-bold text-purple-600">{riskAnalysis?.suggestedActions?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Failed Parameters */}
          {riskAnalysis?.failedParameters?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Areas Needing Improvement</h2>
              <div className="space-y-3">
                {riskAnalysis.failedParameters.map((issue, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-red-700">{issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {riskAnalysis?.suggestedActions?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Suggested Actions</h2>
              <div className="space-y-3">
                {riskAnalysis.suggestedActions.map((action, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-green-700">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Academic Data */}
        <div className="space-y-6">
          {/* Academic Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Attendance</span>
                <span className={`font-medium ${academicData?.attendancePercentage < 80 ? 'text-red-600' : 'text-green-600'}`}>
                  {academicData?.attendancePercentage || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Test Marks</span>
                <span className={`font-medium ${academicData?.periodicalTestMarks < 25 ? 'text-red-600' : 'text-green-600'}`}>
                  {academicData?.periodicalTestMarks || 0}/50
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">CGPA</span>
                <span className={`font-medium ${academicData?.cgpa <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                  {academicData?.cgpa || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Skill Level</span>
                <span className={`font-medium ${academicData?.skillLevel <= 4 ? 'text-red-600' : 'text-green-600'}`}>
                  {academicData?.skillLevel || 0}/10
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Arrears</span>
                <span className={`font-medium ${academicData?.standingArrears ? 'text-red-600' : 'text-green-600'}`}>
                  {academicData?.standingArrears ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Additional Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{academicData?.projectsCompleted || 0}</p>
                <p className="text-sm text-gray-600">Projects</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{academicData?.certificationsCount || 0}</p>
                <p className="text-sm text-gray-600">Certifications</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{academicData?.activityPoints || 0}</p>
                <p className="text-sm text-gray-600">Activity Points</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{academicData?.achievementsCount || 0}</p>
                <p className="text-sm text-gray-600">Achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
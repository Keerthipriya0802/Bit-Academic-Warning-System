const StudentAcademic = require('../models/StudentAcademic');
const Class = require('../models/Class');

class RiskAnalyzer {
  constructor() {
    this.rules = [
      {
        name: 'attendance',
        check: (data, classData) => data.attendancePercentage < 80,
        riskPoints: 2,
        message: 'Attendance below 80%'
      },
      {
        name: 'periodicalTest',
        check: (data) => data.periodicalTestMarks < 25,
        riskPoints: 2,
        message: 'Periodical test marks below 25/50'
      },
      {
        name: 'standingArrears',
        check: (data) => data.standingArrears,
        riskPoints: 3,
        message: 'Has standing arrears'
      },
      {
        name: 'skillLevel',
        check: (data) => data.skillLevel <= 4,
        riskPoints: 1,
        message: 'Skill level is C (≤ 4)'
      },
      {
        name: 'cgpa',
        check: (data) => data.cgpa <= 7,
        riskPoints: 3,
        message: 'CGPA below 7.0'
      },
      {
        name: 'discipline',
        check: (data) => data.disciplineComplaints > 0,
        riskPoints: 2,
        message: 'Has discipline complaints'
      },
      {
        name: 'projects',
        check: (data) => data.projectsCompleted < 1,
        riskPoints: 1,
        message: 'No projects completed'
      },
      {
        name: 'activityPoints',
        check: (data) => data.activityPoints <= 5000,
        riskPoints: 1,
        message: 'Activity points below 5000'
      },
      {
        name: 'rewardPoints',
        check: (data, classData) => data.rewardPoints < (classData?.averageRewardPoints || 0),
        riskPoints: 1,
        message: 'Reward points below class average'
      },
      {
        name: 'certifications',
        check: (data) => data.certificationsCount < 1,
        riskPoints: 1,
        message: 'No certifications'
      },
      {
        name: 'achievements',
        check: (data) => data.achievementsCount < 1,
        riskPoints: 1,
        message: 'No achievements'
      }
    ];
  }

  // Calculate class averages
  async calculateClassAverages(department, batch, semester) {
    try {
      const students = await StudentAcademic.find()
        .populate({
          path: 'studentId',
          match: { 
            department,
            batch,
            semester
          }
        })
        .exec();

      const validStudents = students.filter(s => s.studentId);
      
      if (validStudents.length === 0) {
        return {
          averageRewardPoints: 0,
          averageAttendance: 0,
          averageCGPA: 0,
          totalStudents: 0
        };
      }

      const totalRewardPoints = validStudents.reduce((sum, s) => sum + (s.rewardPoints || 0), 0);
      const totalAttendance = validStudents.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0);
      const totalCGPA = validStudents.reduce((sum, s) => sum + (s.cgpa || 0), 0);

      return {
        averageRewardPoints: totalRewardPoints / validStudents.length,
        averageAttendance: totalAttendance / validStudents.length,
        averageCGPA: totalCGPA / validStudents.length,
        totalStudents: validStudents.length
      };
    } catch (error) {
      console.error('Error calculating class averages:', error);
      return null;
    }
  }

  // Analyze single student
  async analyzeStudent(studentAcademicId, user) {
    try {
      const academicData = await StudentAcademic.findById(studentAcademicId)
        .populate('studentId');
      
      if (!academicData) {
        throw new Error('Academic data not found');
      }

      // Get class averages
      const classData = await this.calculateClassAverages(
        user.department,
        user.batch,
        user.semester
      );

      let riskScore = 0;
      let warningCount = 0;
      let failedParameters = [];
      let suggestedActions = [];

      // Check each rule
      for (const rule of this.rules) {
        const data = academicData.toObject();
        const conditionMet = rule.check(data, classData);
        
        if (conditionMet) {
          riskScore += rule.riskPoints;
          warningCount++;
          failedParameters.push(rule.message);
          
          // Add specific suggestions based on failed rules
          switch (rule.name) {
            case 'attendance':
              suggestedActions.push('Improve attendance immediately');
              suggestedActions.push('Attend all classes regularly');
              break;
            case 'periodicalTest':
              suggestedActions.push('Focus on test preparation');
              suggestedActions.push('Attend remedial classes');
              break;
            case 'standingArrears':
              suggestedActions.push('Clear arrears in next semester');
              suggestedActions.push('Seek academic advisor help');
              break;
            case 'cgpa':
              suggestedActions.push('Improve core subject performance');
              suggestedActions.push('Create study schedule');
              break;
            case 'discipline':
              suggestedActions.push('Maintain discipline in campus');
              suggestedActions.push('Follow college rules');
              break;
          }
        }
      }

      // Check continuous poor performance
      const lastTwoSemesters = academicData.semesterPerformance.slice(-2);
      const poorSemesters = lastTwoSemesters.filter(sem => 
        sem.warningLevel !== 'Safe'
      ).length;

      if (poorSemesters >= 2) {
        riskScore += 3;
        failedParameters.push('Continuous poor performance in last 2 semesters');
        suggestedActions.push('Immediate intervention required');
        suggestedActions.push('Meet HOD for academic plan');
      }

      // Determine warning level
      let warningLevel = 'Safe';
      if (riskScore <= 3) {
        warningLevel = 'Safe';
        suggestedActions.push('Continue current performance');
      } else if (riskScore <= 7) {
        warningLevel = 'Mild Warning';
        suggestedActions.push('Meet academic advisor');
        suggestedActions.push('Create improvement plan');
      } else if (riskScore <= 12) {
        warningLevel = 'Moderate Warning';
        suggestedActions.push('Mandatory meeting with academic advisor');
        suggestedActions.push('Attend remedial classes');
        suggestedActions.push('Submit improvement timeline');
      } else {
        warningLevel = 'Severe Academic Warning';
        suggestedActions.push('Immediate meeting with department head');
        suggestedActions.push('Strict monitoring required');
        suggestedActions.push('Parent/Guardian notification');
        suggestedActions.push('Academic probation consideration');
      }

      // Remove duplicate suggestions
      suggestedActions = [...new Set(suggestedActions)];

      // Update class statistics if student is at risk
      if (warningLevel !== 'Safe') {
        await this.updateClassStatistics(user.department, user.batch, user.semester);
      }

      return {
        riskScore,
        warningCount,
        warningLevel,
        failedParameters,
        suggestedActions,
        classAverages: classData
      };
    } catch (error) {
      console.error('Error analyzing student:', error);
      throw error;
    }
  }

  // Update class statistics
  async updateClassStatistics(department, batch, semester) {
    try {
      const classData = await Class.findOneAndUpdate(
        { department, batch, semester },
        { $inc: { atRiskStudents: 1 }, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      return classData;
    } catch (error) {
      console.error('Error updating class statistics:', error);
    }
  }

  // Calculate risk for all students in a class
  async analyzeClass(department, batch, semester) {
    try {
      const students = await StudentAcademic.find()
        .populate({
          path: 'studentId',
          match: { department, batch, semester },
          select: 'name email studentId'
        })
        .exec();

      const validStudents = students.filter(s => s.studentId);
      const analysisResults = [];

      for (const student of validStudents) {
        const user = student.studentId;
        const analysis = await this.analyzeStudent(student._id, user);
        
        // Update student record
        student.currentRiskScore = analysis.riskScore;
        student.currentWarningLevel = analysis.warningLevel;
        student.failedParameters = analysis.failedParameters;
        student.suggestedActions = analysis.suggestedActions;
        
        // Add to semester performance history
        student.semesterPerformance.push({
          semester: user.semester,
          riskScore: analysis.riskScore,
          warningLevel: analysis.warningLevel,
          issues: analysis.failedParameters
        });

        // Update continuous poor semesters count
        const lastTwo = student.semesterPerformance.slice(-2);
        if (lastTwo.length >= 2 && 
            lastTwo[0].warningLevel !== 'Safe' && 
            lastTwo[1].warningLevel !== 'Safe') {
          student.continuousPoorSemesters = (student.continuousPoorSemesters || 0) + 1;
        }

        await student.save();

        analysisResults.push({
          student: {
            id: user._id,
            name: user.name,
            email: user.email,
            studentId: user.studentId
          },
          analysis
        });
      }

      return analysisResults;
    } catch (error) {
      console.error('Error analyzing class:', error);
      throw error;
    }
  }
}

module.exports = new RiskAnalyzer();
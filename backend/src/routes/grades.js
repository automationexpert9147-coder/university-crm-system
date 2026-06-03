const express = require('express');
const router = express.Router();

const {
  saveGrade,
  publishGrades,
  getCourseGrades,
  getStudentGrades,
} = require('../controllers/gradeController');

const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), saveGrade);

router.post('/publish/:courseId', protect, authorize('teacher', 'admin'), publishGrades);

router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCourseGrades);

router.get('/my', protect, authorize('student'), getStudentGrades);

router.get('/student/:studentId', protect, authorize('teacher', 'admin'), getStudentGrades);

module.exports = router;
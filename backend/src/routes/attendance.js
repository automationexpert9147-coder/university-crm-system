const express = require('express');
const router = express.Router();

const {
  markAttendance,
  getCourseAttendance,
  getStudentAttendance,
} = require('../controllers/attendanceController');

const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), markAttendance);

router.get('/course/:courseId', protect, getCourseAttendance);

router.get('/student', protect, getStudentAttendance);

router.get(
  '/student/:studentId',
  protect,
  authorize('teacher', 'admin'),
  getStudentAttendance
);

module.exports = router;
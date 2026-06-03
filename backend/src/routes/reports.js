const express = require('express');
const router = express.Router();
const { getAttendanceReport, getGradeReport, getSubmissionReport, getDashboardReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/attendance', protect, authorize('teacher', 'admin'), getAttendanceReport);
router.get('/grades', protect, authorize('teacher', 'admin'), getGradeReport);
router.get('/submissions', protect, authorize('teacher', 'admin'), getSubmissionReport);
router.get('/dashboard', protect, authorize('admin'), getDashboardReport);

module.exports = router;

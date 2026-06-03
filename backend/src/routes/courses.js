const express = require('express');
const router = express.Router();
const { createCourse, getAllCourses, getMyCourses, enrollStudent, removeStudent, getCourseById, updateCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), createCourse);
router.get('/', protect, getAllCourses);
router.get('/my', protect, getMyCourses);
router.get('/:id', protect, getCourseById);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.post('/enroll', protect, authorize('admin', 'teacher'), enrollStudent);
router.post('/remove-student', protect, authorize('admin', 'teacher'), removeStudent);

module.exports = router;

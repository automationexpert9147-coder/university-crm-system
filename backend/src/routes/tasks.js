const express = require('express');
const router = express.Router();

const {
  createTask,
  getCourseTasks,
  getMyTasks,
  submitTask,
  getTaskSubmissions,
  gradeSubmission,
  deleteTask,
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), createTask);

router.get('/my', protect, authorize('student'), getMyTasks);

router.get('/course/:courseId', protect, getCourseTasks);

router.post('/:taskId/submit', protect, authorize('student'), submitTask);

router.get(
  '/:taskId/submissions',
  protect,
  authorize('teacher', 'admin'),
  getTaskSubmissions
);

router.put(
  '/submissions/:submissionId/grade',
  protect,
  authorize('teacher', 'admin'),
  gradeSubmission
);

router.delete('/:taskId', protect, authorize('teacher', 'admin'), deleteTask);

module.exports = router;
const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markRead,
  markAllRead,
  sendAnnouncement,
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.post('/announce', protect, authorize('teacher', 'admin'), sendAnnouncement);

module.exports = router;
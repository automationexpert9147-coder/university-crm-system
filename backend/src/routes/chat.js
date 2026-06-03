const express = require('express');
const router = express.Router();

const {
  getMessages,
  saveMessage,
  getContacts,
  getRoomId,
} = require('../controllers/chatController');

const { protect } = require('../middleware/auth');

router.get('/contacts', protect, getContacts);
router.get('/room/:userId', protect, getRoomId);
router.get('/messages/:roomId', protect, getMessages);
router.post('/messages', protect, saveMessage);

module.exports = router;
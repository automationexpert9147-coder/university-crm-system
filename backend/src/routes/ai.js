const express = require('express');
const router = express.Router();
const { askAI, generateQuiz, analyzePerformance } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/ask', protect, askAI);
router.post('/quiz', protect, generateQuiz);
router.post('/analyze', protect, analyzePerformance);

module.exports = router;

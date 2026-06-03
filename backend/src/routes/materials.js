const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  uploadMaterial,
  getCourseMaterials,
  deleteMaterial,
} = require('../controllers/materialController');

const { protect, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post(
  '/',
  protect,
  authorize('teacher', 'admin'),
  upload.single('file'),
  uploadMaterial
);

router.get(
  '/course/:courseId',
  protect,
  getCourseMaterials
);

router.delete(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  deleteMaterial
);

module.exports = router;
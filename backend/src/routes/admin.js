const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser, getDashboardStats, getSystemReport } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/users', protect, authorize('admin'), createUser);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.get('/report', protect, authorize('admin'), getSystemReport);

module.exports = router;

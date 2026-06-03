const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { data: students, error } = await supabase.from('users')
      .select('id, name, email, role, department, semester, roll_number, is_active')
      .eq('role', 'student').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { data: student, error } = await supabase.from('users')
      .select('id, name, email, role, department, semester, roll_number, is_active')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { data: teachers, error } = await supabase.from('users')
      .select('id, name, email, role, department, is_active')
      .eq('role', 'teacher').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    let query = supabase.from('users').select('id, name, email, role, department, semester, roll_number, is_active, created_at', { count: 'exact' });
    if (role) query = query.eq('role', role);
    const from = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);

    const { data: users, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, users, total: count, pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department, semester } = req.body;
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from('users')
      .insert({ name, email, password: hashed, role, roll_number: rollNumber, department, semester: semester ? String(semester) : null })
      .select('id, name, email, role, department, semester, roll_number, is_active')
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, department, semester, rollNumber, isActive } = req.body;

    const updateData = {
      name,
      email,
      role,
      department,
      semester: semester ? String(semester) : null,
      roll_number: rollNumber || null,
    };

    if (typeof isActive === 'boolean') {
      updateData.is_active = isActive;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select('id, name, email, role, department, semester, roll_number, is_active')
      .single();

    if (error) throw error;

    res.json({ success: true, user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [{ count: students }, { count: teachers }, { count: admins }, { count: courses }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const { data: recentUsers } = await supabase.from('users')
      .select('id, name, email, role, created_at').order('created_at', { ascending: false }).limit(5);
    const { data: recentCourses } = await supabase.from('courses')
      .select('*, teacher:users!teacher_id(name)').order('created_at', { ascending: false }).limit(5);

    res.json({ success: true, stats: { students, teachers, admins, courses, total: students + teachers + admins }, recentUsers, recentCourses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSystemReport = async (req, res) => {
  try {
    const { data: grades } = await supabase.from('grades').select('grade');
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    (grades || []).forEach(g => { if (g.grade) dist[g.grade]++; });
    res.json({ success: true, report: { gradeDistribution: dist } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

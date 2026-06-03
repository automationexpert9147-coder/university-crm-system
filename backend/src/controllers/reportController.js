const supabase = require('../config/supabase');

exports.getAttendanceReport = async (req, res) => {
  try {
    const { courseId } = req.query;

    let query = supabase
      .from('attendance_records')
      .select(`
        status,
        student:users(id, name, roll_number),
        attendance:attendance!inner(
          date,
          course_id,
          course:courses(id, name, code)
        )
      `);

    if (courseId) {
      query = query.eq('attendance.course_id', courseId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {};

    (data || []).forEach((record) => {
      const studentId = record.student?.id;
      if (!studentId) return;

      if (!stats[studentId]) {
        stats[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }

      stats[studentId].total += 1;

      if (record.status === 'present') stats[studentId].present += 1;
      if (record.status === 'absent') stats[studentId].absent += 1;
      if (record.status === 'late') stats[studentId].late += 1;
    });

    const report = Object.values(stats).map((item) => ({
      ...item,
      percentage:
        item.total > 0
          ? (((item.present + item.late) / item.total) * 100).toFixed(1)
          : '0.0',
    }));

    res.json({ success: true, report });
  } catch (err) {
    console.error('Attendance report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGradeReport = async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = supabase.from('grades')
      .select('*, student:users(id, name, roll_number), course:courses(id, name, code)')
      .eq('is_published', true);
    if (courseId) query = query.eq('course_id', courseId);

    const { data: grades, error } = await query;
    if (error) throw error;

    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    (grades || []).forEach(g => { if (g.grade) dist[g.grade]++; });
    const avg = grades?.length > 0 ? (grades.reduce((s, g) => s + (g.total || 0), 0) / grades.length).toFixed(2) : 0;

    res.json({ success: true, grades, distribution: dist, averageScore: avg, total: grades?.length || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubmissionReport = async (req, res) => {
  try {
    const { data: submissions, error } = await supabase.from('submissions')
      .select('*, student:users(id, name, roll_number), task:tasks(id, title, course:courses(id, name))');
    if (error) throw error;

    const onTime = (submissions || []).filter(s => !s.is_late).length;
    const late = (submissions || []).filter(s => s.is_late).length;
    const graded = (submissions || []).filter(s => s.status === 'graded').length;

    res.json({ success: true, submissions, stats: { total: submissions?.length || 0, onTime, late, graded } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardReport = async (req, res) => {
  try {
    const [{ count: totalStudents }, { count: totalTeachers }, { count: totalCourses }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    const { data: recentGrades } = await supabase.from('grades')
      .select('*, course:courses(name)').eq('is_published', true).order('published_at', { ascending: false }).limit(5);

    res.json({ success: true, stats: { totalStudents, totalTeachers, totalCourses }, recentGrades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

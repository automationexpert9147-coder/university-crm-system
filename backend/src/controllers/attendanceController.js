const supabase = require('../config/supabase');

exports.markAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance records are required',
      });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const markedBy = req.user?.id || req.user?._id || null;

    const { data: session, error: sessionErr } = await supabase
      .from('attendance')
      .upsert(
        {
          course_id: courseId,
          date,
          marked_by: markedBy,
        },
        {
          onConflict: 'course_id,date',
        }
      )
      .select('id')
      .single();

    if (sessionErr) throw sessionErr;

    const newRecords = records
      .map((record) => ({
        attendance_id: session.id,
        student_id: record.student || record.studentId || record.student_id,
        status: record.status || 'absent',
      }))
      .filter((record) => record.student_id);

    if (newRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student attendance records found',
      });
    }

    const { error: deleteErr } = await supabase
      .from('attendance_records')
      .delete()
      .eq('attendance_id', session.id);

    if (deleteErr) throw deleteErr;

    const { data: insertedRecords, error: recErr } = await supabase
      .from('attendance_records')
      .insert(newRecords)
      .select('id, attendance_id, student_id, status');

    if (recErr) throw recErr;

    const absentRecords = newRecords.filter(
      (record) => record.status === 'absent'
    );

    for (const record of absentRecords) {
      await supabase.from('notifications').insert({
        user_id: record.student_id,
        sender_id: markedBy,
        type: 'attendance',
        title: 'Absent Marked',
        message: `You were marked absent in ${course.name} on ${new Date(
          date
        ).toLocaleDateString()}`,
      });

      if (req.io) {
        req.io.to(record.student_id).emit('notification', {
          type: 'attendance',
        });
      }
    }

    res.json({
      success: true,
      message: 'Attendance saved',
      attendanceId: session.id,
      recordsInserted: insertedRecords?.length || 0,
      records: insertedRecords || [],
    });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCourseAttendance = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(
        `
        id,
        course_id,
        date,
        marked_by,
        created_at,
        course:courses(id, name, code),
        records:attendance_records(
          id,
          status,
          student_id,
          student:users(id, name, roll_number)
        )
      `
      )
      .eq('course_id', req.params.courseId)
      .order('date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      attendance: data || [],
    });
  } catch (err) {
    console.error('Get course attendance error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.id;
    const { courseId } = req.query;

    let query = supabase
      .from('attendance')
      .select(
        'id, date, course:courses(id, name, code), records:attendance_records!inner(status, student_id)'
      )
      .eq('attendance_records.student_id', studentId);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    const records = (data || []).map((attendance) => ({
      date: attendance.date,
      course: attendance.course,
      status: attendance.records?.[0]?.status || 'absent',
    }));

    const total = records.length;
    const present = records.filter((record) => record.status === 'present').length;
    const absent = records.filter((record) => record.status === 'absent').length;
    const late = records.filter((record) => record.status === 'late').length;

    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      records,
      stats: {
        total,
        present,
        absent,
        late,
        percentage,
      },
    });
  } catch (err) {
    console.error('Get student attendance error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
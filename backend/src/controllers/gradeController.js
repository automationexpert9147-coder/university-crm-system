const supabase = require('../config/supabase');

const MAX_MARKS = {
  midterm: 18,
  final: 24,
  assignments: 8,
  practical: 10,
};

const calcGrade = (midterm, final, assignments, practical) => {
  const safeMidterm = Number(midterm || 0);
  const safeFinal = Number(final || 0);
  const safeAssignments = Number(assignments || 0);
  const safePractical = Number(practical || 0);

  const total = safeMidterm + safeFinal + safeAssignments + safePractical;
  const roundedTotal = Number(total.toFixed(2));
  const percentage = Number(((roundedTotal / 60) * 100).toFixed(2));

  const grade =
    roundedTotal >= 48
      ? 'A'
      : roundedTotal >= 39
        ? 'B'
        : roundedTotal >= 31
          ? 'C'
          : roundedTotal >= 25
            ? 'D'
            : 'F';

  return {
    total: roundedTotal,
    percentage,
    grade,
  };
};

exports.saveGrade = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      midterm,
      final,
      assignments,
      practical,
      remarks,
    } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const midtermMarks = Number(midterm || 0);
    const finalMarks = Number(final || 0);
    const assignmentQuizMarks = Number(assignments || 0);
    const practicalMarks = Number(practical || 0);

    if (
      midtermMarks < 0 ||
      midtermMarks > MAX_MARKS.midterm ||
      finalMarks < 0 ||
      finalMarks > MAX_MARKS.final ||
      assignmentQuizMarks < 0 ||
      assignmentQuizMarks > MAX_MARKS.assignments ||
      practicalMarks < 0 ||
      practicalMarks > MAX_MARKS.practical
    ) {
      return res.status(400).json({
        success: false,
        message: 'Marks are outside the allowed range',
      });
    }

    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
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

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError) throw enrollmentError;

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course',
      });
    }

    const { total, grade } = calcGrade(
      midtermMarks,
      finalMarks,
      assignmentQuizMarks,
      practicalMarks
    );

    const { data, error } = await supabase
      .from('grades')
      .upsert(
        {
          student_id: studentId,
          course_id: courseId,
          midterm: midtermMarks,
          final: finalMarks,
          assignments: assignmentQuizMarks,
          quizzes: 0,
          practical: practicalMarks,
          total,
          grade,
          remarks: remarks || null,
        },
        {
          onConflict: 'student_id,course_id',
        }
      )
      .select('*, student:users(id, name, roll_number), course:courses(id, name, code)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      grade: {
        ...data,
        percentage: Number(((Number(data.total || 0) / 60) * 100).toFixed(2)),
      },
    });
  } catch (err) {
    console.error('Save grade error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.publishGrades = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const teacherId = req.user?.id || req.user?._id || null;

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

    const { data: grades, error: gradeError } = await supabase
      .from('grades')
      .select('id, grade, student:users(id, name)')
      .eq('course_id', courseId)
      .eq('is_published', false);

    if (gradeError) throw gradeError;

    if (!grades || grades.length === 0) {
      return res.json({
        success: true,
        message: 'No unpublished grades found',
        publishedCount: 0,
      });
    }

    const gradeIds = grades.map((grade) => grade.id);

    const { error: updateError } = await supabase
      .from('grades')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .in('id', gradeIds);

    if (updateError) throw updateError;

    const notifications = grades
      .filter((grade) => grade.student?.id)
      .map((grade) => ({
        user_id: grade.student.id,
        sender_id: teacherId,
        type: 'grade',
        title: 'Results Published',
        message: `Your results for ${course.name} are published. Grade: ${grade.grade}`,
      }));

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;

      if (req.io) {
        notifications.forEach((notification) => {
          req.io.to(notification.user_id).emit('notification', { type: 'grade' });
        });
      }
    }

    res.json({
      success: true,
      message: `Published grades for ${grades.length} students`,
      publishedCount: grades.length,
    });
  } catch (err) {
    console.error('Publish grades error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCourseGrades = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const { data: grades, error } = await supabase
      .from('grades')
      .select('*, student:users(id, name, roll_number, email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const gradesWithPercentage = (grades || []).map((grade) => ({
      ...grade,
      percentage: Number(((Number(grade.total || 0) / 60) * 100).toFixed(2)),
    }));

    res.json({
      success: true,
      grades: gradesWithPercentage,
    });
  } catch (err) {
    console.error('Get course grades error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user?.id || req.user?._id;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    const { data: grades, error } = await supabase
      .from('grades')
      .select('*, course:courses(id, name, code, credit_hours)')
      .eq('student_id', studentId)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    const gradesWithPercentage = (grades || []).map((grade) => ({
      ...grade,
      percentage: Number(((Number(grade.total || 0) / 60) * 100).toFixed(2)),
    }));

    const gpaMap = {
      A: 4,
      B: 3,
      C: 2,
      D: 1,
      F: 0,
    };

    let totalCredits = 0;
    let totalPoints = 0;

    gradesWithPercentage.forEach((grade) => {
      const credits = Number(grade.course?.credit_hours || 3);
      totalCredits += credits;
      totalPoints += (gpaMap[grade.grade] || 0) * credits;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      success: true,
      grades: gradesWithPercentage,
      gpa,
    });
  } catch (err) {
    console.error('Get student grades error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
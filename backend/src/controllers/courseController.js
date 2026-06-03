const supabase = require('../config/supabase');
const notifyAdmins = require('../utils/notifyAdmins');

exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, semester, department, creditHours, teacherId } = req.body;

    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists',
      });
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        name,
        code,
        description,
        semester: semester ? String(semester) : null,
        department,
        credit_hours: creditHours,
        teacher_id: teacherId || req.user.id,
      })
      .select('*, teacher:users!teacher_id(id, name, email)')
      .single();

    if (error) throw error;

    await notifyAdmins({
      senderId: req.user.id,
      type: 'course',
      title: 'New Course Created',
      message: `${course.name} (${course.code}) has been created by ${course.teacher?.name || req.user.name || 'a teacher'}.`,
      io: req.io,
    });

    res.status(201).json({
      success: true,
      course,
    });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*, teacher:users!teacher_id(id, name, email), students:enrollments(student:users(id, name, email, roll_number))')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const formattedCourses = (courses || []).map((course) => ({
      ...course,
      students: (course.students || [])
        .map((enrollment) => enrollment.student)
        .filter(Boolean),
    }));

    res.json({
      success: true,
      courses: formattedCourses,
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    let courses;

    if (req.user.role === 'teacher') {
      const { data, error } = await supabase
        .from('courses')
        .select('*, students:enrollments(student:users(id, name, email, roll_number, semester))')
        .eq('teacher_id', req.user.id)
        .eq('is_active', true);

      if (error) throw error;

      courses = (data || []).map((course) => ({
        ...course,
        students: (course.students || [])
          .map((enrollment) => enrollment.student)
          .filter(Boolean),
      }));
    } else {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select('course:courses(*, teacher:users!teacher_id(id, name, email))')
        .eq('student_id', req.user.id);

      if (error) throw error;

      courses = (enrollments || [])
        .map((enrollment) => enrollment.course)
        .filter(Boolean);
    }

    res.json({
      success: true,
      courses,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*, teacher:users!teacher_id(id, name, email, phone), students:enrollments(student:users(id, name, email, roll_number, semester))')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.students = (course.students || [])
      .map((enrollment) => enrollment.student)
      .filter(Boolean);

    res.json({
      success: true,
      course,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      semester,
      department,
      creditHours,
      teacherId,
      isActive,
    } = req.body;

    const updateData = {
      name,
      code,
      description,
      semester: semester ? String(semester) : null,
      department,
      credit_hours: creditHours,
    };

    if (teacherId) {
      updateData.teacher_id = teacherId;
    }

    if (typeof isActive === 'boolean') {
      updateData.is_active = isActive;
    }

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, teacher:users!teacher_id(id, name, email)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      course,
    });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled',
      });
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId,
      });

    if (error) throw error;

    const { data: course } = await supabase
      .from('courses')
      .select('id, name, code')
      .eq('id', courseId)
      .maybeSingle();

    const { data: student } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', studentId)
      .maybeSingle();

    await notifyAdmins({
      senderId: req.user.id,
      type: 'course',
      title: 'Student Enrolled in Course',
      message: `${student?.name || 'A student'} has been enrolled in ${course?.name || 'a course'}${course?.code ? ` (${course.code})` : ''}.`,
      io: req.io,
    });

    res.json({
      success: true,
      message: 'Student enrolled successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Student removed from course',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
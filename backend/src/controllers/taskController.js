const supabase = require('../config/supabase');
const notifyAdmins = require('../utils/notifyAdmins');

exports.createTask = async (req, res) => {
  try {
    const { title, description, courseId, type, dueDate, totalMarks } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required',
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

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        course_id: courseId,
        teacher_id: teacherId,
        type: type || 'assignment',
        due_date: dueDate,
        total_marks: totalMarks || 100,
        is_active: true,
      })
      .select('*, course:courses(id, name, code)')
      .single();

    if (error) throw error;

    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId);

    if (enrollmentError) throw enrollmentError;

    const notifications = (enrollments || []).map((enrollment) => ({
      user_id: enrollment.student_id,
      sender_id: teacherId,
      type: 'task',
      title: `New ${task.type}: ${task.title}`,
      message: `New ${task.type} in ${task.course?.name || course.name}. Due: ${new Date(task.due_date).toLocaleDateString()}`,
    }));

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;

      if (req.io) {
        notifications.forEach((notification) => {
          req.io.to(notification.user_id).emit('notification', {
            type: 'task',
          });
        });
      }
    }

    res.status(201).json({
      success: true,
      task,
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCourseTasks = async (req, res) => {
  try {
    const { courseId } = req.params;

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, teacher:users!teacher_id(id, name)')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('created_at', {
        ascending: false,
      });

    if (error) throw error;

    res.json({
      success: true,
      tasks: tasks || [],
    });
  } catch (err) {
    console.error('Get course tasks error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;

    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    if (enrollmentError) throw enrollmentError;

    const courseIds = (enrollments || []).map((enrollment) => enrollment.course_id);

    if (!courseIds.length) {
      return res.json({
        success: true,
        tasks: [],
      });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, course:courses(id, name, code), teacher:users!teacher_id(id, name)')
      .in('course_id', courseIds)
      .eq('is_active', true)
      .order('due_date', {
        ascending: true,
      });

    if (error) throw error;

    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('id, task_id, status, marks, feedback, submitted_at, is_late')
      .eq('student_id', studentId);

    if (submissionError) throw submissionError;

    const submissionMap = {};

    (submissions || []).forEach((submission) => {
      submissionMap[submission.task_id] = submission;
    });

    const tasksWithStatus = (tasks || []).map((task) => ({
      ...task,
      submission: submissionMap[task.id] || null,
    }));

    res.json({
      success: true,
      tasks: tasksWithStatus,
    });
  } catch (err) {
    console.error('Get my tasks error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const studentId = req.user?.id || req.user?._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Submission content is required',
      });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, due_date, teacher_id, title')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from('submissions')
      .select('id, status')
      .eq('task_id', taskId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing && existing.status !== 'resubmit') {
      return res.status(400).json({
        success: false,
        message: 'Already submitted',
      });
    }

    const isLate = new Date() > new Date(task.due_date);

    let submission;

    if (existing) {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          content,
          status: 'submitted',
          is_late: isLate,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      submission = data;
    } else {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          task_id: taskId,
          student_id: studentId,
          content,
          is_late: isLate,
          status: 'submitted',
        })
        .select()
        .single();

      if (error) throw error;

      submission = data;
    }

    await supabase.from('notifications').insert({
      user_id: task.teacher_id,
      sender_id: studentId,
      type: 'submission',
      title: 'New Submission',
      message: `${req.user.name} submitted "${task.title}"`,
    });

    if (req.io) {
      req.io.to(task.teacher_id).emit('notification', {
        type: 'submission',
      });
    }

    await notifyAdmins({
      senderId: studentId,
      type: 'submission',
      title: 'New Task Submission',
      message: `${req.user.name} submitted "${task.title}".`,
      io: req.io,
    });

    res.json({
      success: true,
      submission,
    });
  } catch (err) {
    console.error('Submit task error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getTaskSubmissions = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, student:users(id, name, roll_number, email)')
      .eq('task_id', taskId)
      .order('submitted_at', {
        ascending: false,
      });

    if (error) throw error;

    res.json({
      success: true,
      submissions: submissions || [],
    });
  } catch (err) {
    console.error('Get task submissions error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null || marks === '') {
      return res.status(400).json({
        success: false,
        message: 'Marks are required',
      });
    }

    const teacherId = req.user?.id || req.user?._id || null;

    const { data: submission, error } = await supabase
      .from('submissions')
      .update({
        marks,
        feedback,
        status: 'graded',
      })
      .eq('id', req.params.submissionId)
      .select('*, student:users(id, name)')
      .single();

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: submission.student.id,
      sender_id: teacherId,
      type: 'grade',
      title: 'Assignment Graded',
      message: `Your submission has been graded. Marks: ${marks}. ${feedback ? 'Feedback: ' + feedback : ''}`,
    });

    if (req.io) {
      req.io.to(submission.student.id).emit('notification', {
        type: 'grade',
      });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { error } = await supabase
      .from('tasks')
      .update({
        is_active: false,
      })
      .eq('id', taskId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
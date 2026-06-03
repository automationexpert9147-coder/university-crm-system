import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaPlus, FaTrash, FaEye, FaCheck } from 'react-icons/fa';

const ManageTasks = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [viewTask, setViewTask] = useState(null);
  const [grading, setGrading] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'assignment',
    dueDate: '',
    totalMarks: 100,
  });

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const { data } = await api.get('/courses/my');
      setCourses(data.courses || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchTasks = async (courseId) => {
    if (!courseId) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(`/tasks/course/${courseId}`);
      setTasks(data.tasks || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setTasks([]);
    setViewTask(null);
    setSubmissions([]);
    setShowForm(false);

    if (courseId) {
      fetchTasks(courseId);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }

    try {
      await api.post('/tasks', {
        ...form,
        courseId: selectedCourse,
      });

      toast.success('Task created!');
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        type: 'assignment',
        dueDate: '',
        totalMarks: 100,
      });

      fetchTasks(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const viewSubmissions = async (task) => {
    const taskId = getTaskId(task);

    if (!taskId) {
      toast.error('Task ID missing');
      return;
    }

    try {
      setViewTask(task);
      const { data } = await api.get(`/tasks/${taskId}/submissions`);
      setSubmissions(data.submissions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load submissions');
    }
  };

  const handleGrade = async (submissionId) => {
    const gradeData = grading[submissionId];

    if (!gradeData?.marks && gradeData?.marks !== 0) {
      toast.error('Enter marks');
      return;
    }

    try {
      await api.put(`/tasks/submissions/${submissionId}/grade`, gradeData);
      toast.success('Graded successfully!');
      viewSubmissions(viewTask);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Tasks</h1>

        {selectedCourse && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus size={12} />
            Create Task
          </button>
        )}
      </div>

      <div className="card">
        <label className="label">Select Course</label>

        <select
          className="input max-w-sm"
          value={selectedCourse}
          onChange={(e) => handleCourseChange(e.target.value)}
        >
          <option value="">Choose Course</option>
          {courses.map((course) => {
            const courseId = getCourseId(course);

            return (
              <option key={courseId} value={courseId}>
                {course.name} ({course.code})
              </option>
            );
          })}
        </select>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">New Task</h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input
                  className="input"
                  placeholder="Assignment 1: Data Structures"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Task details..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                  <option value="quiz">Quiz</option>
                  <option value="lab">Lab</option>
                </select>
              </div>

              <div>
                <label className="label">Total Marks</label>
                <input
                  className="input"
                  type="number"
                  value={form.totalMarks}
                  min={1}
                  max={100}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      totalMarks: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Due Date</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Create Task
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!selectedCourse ? (
        <div className="card text-center py-8 text-gray-400">
          Select a course to manage tasks
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              No tasks yet. Create one!
            </div>
          ) : (
            tasks.map((task) => {
              const taskId = getTaskId(task);
              const dueDate = getDueDate(task);
              const totalMarks = getTotalMarks(task);
              const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;

              return (
                <div key={taskId} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">
                          {task.type || 'task'}
                        </span>

                        {isOverdue && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                            Overdue
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Due: {dueDate ? new Date(dueDate).toLocaleString() : 'No due date'} •{' '}
                        {totalMarks} marks
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => viewSubmissions(task)}
                        className="btn-secondary flex items-center gap-1 text-sm py-1.5"
                      >
                        <FaEye size={12} />
                        Submissions
                      </button>

                      <button
                        onClick={() => handleDelete(taskId)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {viewTask && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Submissions: {viewTask.title}
            </h2>

            <button
              onClick={() => {
                setViewTask(null);
                setSubmissions([]);
              }}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕ Close
            </button>
          </div>

          {submissions.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              No submissions yet
            </p>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const submissionId = getSubmissionId(submission);
                const submittedAt = getSubmittedAt(submission);
                const isLate = getIsLate(submission);
                const totalMarks = getTotalMarks(viewTask);

                return (
                  <div key={submissionId} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.student?.name || 'Unknown Student'}
                        </p>

                        <p className="text-xs text-gray-500">
                          {getRollNumber(submission.student) || submission.student?.email || 'No roll number'}
                          {submittedAt ? ` • ${new Date(submittedAt).toLocaleString()}` : ''}
                          {isLate ? ' • ⚠️ Late' : ''}
                        </p>

                        {submission.content && (
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded p-2">
                            {submission.content}
                          </p>
                        )}
                      </div>

                      {submission.status === 'graded' ? (
                        <div className="text-center flex-shrink-0">
                          <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                            {submission.marks}/{totalMarks}
                          </span>

                          <p className="text-xs text-gray-400 mt-1">
                            Graded
                          </p>

                          {submission.feedback && (
                            <p className="text-xs text-gray-500 mt-1 max-w-40">
                              {submission.feedback}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            placeholder="Marks"
                            min={0}
                            max={totalMarks}
                            className="input w-20 text-sm"
                            onChange={(e) =>
                              setGrading((g) => ({
                                ...g,
                                [submissionId]: {
                                  ...g[submissionId],
                                  marks: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />

                          <input
                            type="text"
                            placeholder="Feedback"
                            className="input w-36 text-sm"
                            onChange={(e) =>
                              setGrading((g) => ({
                                ...g,
                                [submissionId]: {
                                  ...g[submissionId],
                                  feedback: e.target.value,
                                },
                              }))
                            }
                          />

                          <button
                            onClick={() => handleGrade(submissionId)}
                            className="btn-success flex items-center gap-1 text-sm py-1.5"
                          >
                            <FaCheck size={10} />
                            Grade
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getCourseId = (course) => course.id || course._id;

const getTaskId = (task) => task.id || task._id;

const getSubmissionId = (submission) => submission.id || submission._id;

const getDueDate = (task) => task.due_date || task.dueDate;

const getTotalMarks = (task) => task.total_marks || task.totalMarks || 0;

const getSubmittedAt = (submission) => submission.submitted_at || submission.submittedAt;

const getIsLate = (submission) => {
  if (typeof submission.is_late === 'boolean') return submission.is_late;
  if (typeof submission.isLate === 'boolean') return submission.isLate;
  return false;
};

const getRollNumber = (student) => {
  if (!student) return '';
  return student.roll_number || student.rollNumber || '';
};

export default ManageTasks;
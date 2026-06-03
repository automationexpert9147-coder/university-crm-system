import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FaClock,
  FaCheckCircle,
  FaUpload,
  FaExclamationTriangle,
} from 'react-icons/fa';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks/my');
      setTasks(data.tasks || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (taskId) => {
    if (!taskId) {
      toast.error('Task ID missing');
      return;
    }

    if (!content.trim()) {
      toast.error('Please write your submission content');
      return;
    }

    setSubmitting(taskId);

    try {
      await api.post(`/tasks/${taskId}/submit`, { content });

      toast.success('Task submitted successfully!');
      setSelected(null);
      setContent('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(null);
    }
  };

  const filtered = tasks.filter((task) => {
    if (filter === 'pending') return !task.submission;
    if (filter === 'submitted') return task.submission;
    return true;
  });

  const typeColor = {
    assignment: 'blue',
    project: 'purple',
    quiz: 'yellow',
    lab: 'green',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks & Projects</h1>

        <div className="flex gap-2">
          {['all', 'pending', 'submitted'].map((filterName) => (
            <button
              key={filterName}
              type="button"
              onClick={() => setFilter(filterName)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                filter === filterName
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterName}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FaCheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => {
            const taskId = getTaskId(task);
            const dueDate = getDueDate(task);
            const totalMarks = getTotalMarks(task);
            const submission = task.submission;
            const overdue = isOverdue(dueDate);
            const color = typeColor[task.type] || 'blue';

            return (
              <div key={taskId} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`${getTypeBadgeClass(color)} text-xs font-medium px-2 py-0.5 rounded-full capitalize`}
                      >
                        {task.type || 'task'}
                      </span>

                      {submission ? (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          Submitted
                        </span>
                      ) : overdue ? (
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FaExclamationTriangle size={10} />
                          Overdue
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}

                      {submission?.marks !== undefined &&
                        submission?.marks !== null && (
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            Score: {submission.marks}/{totalMarks}
                          </span>
                        )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mt-2">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>{task.course?.name || 'No Course'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaClock size={10} />
                        Due: {dueDate ? new Date(dueDate).toLocaleString() : 'No due date'}
                      </span>
                      <span>•</span>
                      <span>Total Marks: {totalMarks}</span>
                    </div>

                    {submission?.feedback && (
                      <div className="mt-3 bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800">
                          Teacher Feedback:
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {!submission && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(selected === taskId ? null : taskId);
                        setContent('');
                      }}
                      className="btn-primary flex items-center gap-2 text-sm ml-4"
                    >
                      <FaUpload size={12} />
                      Submit
                    </button>
                  )}
                </div>

                {selected === taskId && (
                  <div className="mt-4 border-t pt-4">
                    <label className="label">Submission Content</label>

                    <textarea
                      className="input"
                      rows={4}
                      placeholder="Write your answer or describe your work..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleSubmit(taskId)}
                        disabled={submitting === taskId}
                        className="btn-primary"
                      >
                        {submitting === taskId ? 'Submitting...' : 'Submit Task'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelected(null);
                          setContent('');
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const getTaskId = (task) => task.id || task._id;

const getDueDate = (task) => task.due_date || task.dueDate;

const getTotalMarks = (task) => task.total_marks || task.totalMarks || 0;

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const getTypeBadgeClass = (color) => {
  const classes = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
  };

  return classes[color] || classes.blue;
};

export default Tasks;
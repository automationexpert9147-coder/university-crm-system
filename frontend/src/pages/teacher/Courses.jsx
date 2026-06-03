import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FaPlus, FaUserPlus, FaUserMinus } from 'react-icons/fa';

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    semester: '',
    department: '',
    creditHours: 3,
  });
  const [enrollModal, setEnrollModal] = useState(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');

  const fetchCourses = async () => {
    const { data } = await api.get('/courses/my');
    setCourses(data.courses || []);
  };

  const fetchStudents = async () => {
    const { data } = await api.get('/students');
    setAllStudents(data.students || []);
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await api.post('/courses', form);
      toast.success('Course created!');
      setShowForm(false);
      setForm({
        name: '',
        code: '',
        description: '',
        semester: '',
        department: '',
        creditHours: 3,
      });
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleEnroll = async () => {
    if (!enrollModal) {
      toast.error('Course not selected');
      return;
    }

    if (!enrollStudentId) {
      toast.error('Please select a student');
      return;
    }

    try {
      await api.post('/courses/enroll', {
        courseId: enrollModal,
        studentId: enrollStudentId,
      });

      toast.success('Student enrolled!');
      setEnrollModal(null);
      setEnrollStudentId('');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enroll failed');
    }
  };

  const handleRemove = async (courseId, studentId) => {
    if (!confirm('Remove this student?')) return;

    try {
      await api.post('/courses/remove-student', { courseId, studentId });
      toast.success('Student removed');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed');
    }
  };

  const openEnrollModal = (course) => {
    const courseId = getCourseId(course);

    if (!courseId) {
      toast.error('Course ID missing');
      return;
    }

    setEnrollStudentId('');
    setEnrollModal(courseId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus size={12} />
          New Course
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">Create Course</h2>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Course Name</label>
              <input
                className="input"
                placeholder="Data Structures"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Course Code</label>
              <input
                className="input"
                placeholder="CS-301"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Semester</label>
              <select
                className="input"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Credit Hours</label>
              <input
                className="input"
                type="number"
                min={1}
                max={6}
                value={form.creditHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, creditHours: parseInt(e.target.value) || 1 }))
                }
              />
            </div>

            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                Create
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

      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No courses found</p>
          </div>
        ) : (
          courses.map((course) => {
            const courseId = getCourseId(course);
            const creditHours = getCreditHours(course);

            return (
              <div key={courseId} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{course.name}</h2>
                    <p className="text-sm text-gray-500">
                      {course.code} • {creditHours} Credit Hours • Semester{' '}
                      {course.semester || '—'}
                    </p>

                    {course.description && (
                      <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEnrollModal(course)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <FaUserPlus size={12} />
                    Enroll Student
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Students ({course.students?.length || 0})
                </h3>

                {!course.students || course.students.length === 0 ? (
                  <p className="text-xs text-gray-400">No students enrolled</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {course.students.map((student) => {
                      const studentId = getStudentId(student);

                      return (
                        <div
                          key={studentId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {getRollNumber(student) || student.email}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(courseId, studentId)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <FaUserMinus size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {enrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-gray-900 mb-4">Enroll Student</h2>

            <select
              className="input mb-4"
              value={enrollStudentId}
              onChange={(e) => setEnrollStudentId(e.target.value)}
            >
              <option value="">Select student</option>
              {allStudents.map((student) => {
                const studentId = getStudentId(student);

                return (
                  <option key={studentId} value={studentId}>
                    {student.name} ({getRollNumber(student) || student.email})
                  </option>
                );
              })}
            </select>

            <div className="flex gap-3">
              <button onClick={handleEnroll} className="btn-primary flex-1">
                Enroll
              </button>

              <button
                onClick={() => {
                  setEnrollModal(null);
                  setEnrollStudentId('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getCourseId = (course) => course.id || course._id;

const getStudentId = (student) => student.id || student._id;

const getCreditHours = (course) => course.credit_hours || course.creditHours || 0;

const getRollNumber = (student) => student.roll_number || student.rollNumber || '';

export default TeacherCourses;
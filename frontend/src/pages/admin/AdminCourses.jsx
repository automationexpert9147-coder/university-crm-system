import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  FaGraduationCap,
  FaUsers,
  FaChalkboardTeacher,
  FaPlus,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';

const emptyForm = {
  name: '',
  code: '',
  description: '',
  semester: '',
  department: '',
  creditHours: '',
  teacherId: '',
};

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses');
      setCourses(data.courses || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/users?role=teacher&limit=100');
      setTeachers(data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load teachers');
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditCourse(null);
    setShowForm(false);
  };

  const handleEdit = (course) => {
    setEditCourse(course);
    setForm({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      semester: course.semester || '',
      department: course.department || '',
      creditHours: course.credit_hours || course.creditHours || '',
      teacherId: course.teacher?.id || course.teacher_id || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editCourse) {
        await api.put(`/courses/${getCourseId(editCourse)}`, form);
        toast.success('Course updated successfully');
      } else {
        await api.post('/courses', form);
        toast.success('Course created successfully');
      }

      resetForm();
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDeactivate = async (course) => {
    if (!confirm('Deactivate this course?')) return;

    try {
      await api.put(`/courses/${getCourseId(course)}`, {
        name: course.name,
        code: course.code,
        description: course.description || '',
        semester: course.semester || '',
        department: course.department || '',
        creditHours: course.credit_hours || course.creditHours || '',
        teacherId: course.teacher?.id || course.teacher_id || '',
        isActive: false,
      });

      toast.success('Course deactivated');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate course');
    }
  };

  if (loading) {
    return <div className="card text-center py-12 text-gray-400">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          All Courses <span className="text-gray-400 text-lg">({courses.length})</span>
        </h1>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditCourse(null);
            setForm(emptyForm);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus size={12} /> Add Course
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">
            {editCourse ? 'Edit Course' : 'Create New Course'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Course Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Course Code</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Department</label>
              <select
                className="input"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                required
              >
                <option value="">Select Department</option>
                {[
                  'Computer Science',
                  'Software Engineering',
                  'Information Technology',
                  'Agriculture',
                  'Business Administration',
                  'Mathematics',
                ].map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Semester</label>
              <select
                className="input"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Credit Hours</label>
              <input
                className="input"
                type="number"
                min="1"
                max="6"
                value={form.creditHours}
                onChange={(e) => setForm((f) => ({ ...f, creditHours: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Assign Teacher</label>
              <select
                className="input"
                value={form.teacherId}
                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={getUserId(teacher)} value={getUserId(teacher)}>
                    {teacher.name} - {teacher.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-24"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Course description"
              />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                {editCourse ? 'Update Course' : 'Create Course'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={getCourseId(course)} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaGraduationCap className="text-blue-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">{course.name}</h3>
                  <p className="text-xs text-gray-500">
                    {course.code} • {getCreditHours(course)} Credits
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(course)}
                  className="text-blue-500 hover:text-blue-700 p-1"
                  title="Edit course"
                >
                  <FaEdit size={14} />
                </button>

                <button
                  onClick={() => handleDeactivate(course)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Deactivate course"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaChalkboardTeacher className="text-green-500" size={12} />
                <span>{course.teacher?.name || 'No teacher assigned'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaUsers className="text-blue-500" size={12} />
                <span>{course.students?.length || 0} students</span>
              </div>

              <p className="text-xs text-gray-500">
                {course.department || 'No department'} • Semester {course.semester || 'N/A'}
              </p>

              {course.description && (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className="card text-center py-12 text-gray-400">No courses found</div>
      )}
    </div>
  );
};

const getCourseId = (course) => course.id || course._id;
const getUserId = (user) => user.id || user._id;
const getCreditHours = (course) => course.credit_hours || course.creditHours || 0;

export default AdminCourses;
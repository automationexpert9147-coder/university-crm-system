import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FaUsers,
  FaTasks,
  FaBook,
  FaGraduationCap,
  FaCalendarCheck,
} from 'react-icons/fa';

const TeacherDashboard = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    tasks: 0,
    courses: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/courses/my');

        const teacherCourses = data.courses || [];
        setCourses(teacherCourses);

        const totalStudents = teacherCourses.reduce((sum, course) => {
          return sum + (course.students?.length || 0);
        }, 0);

        setStats({
          students: totalStudents,
          tasks: 0,
          courses: teacherCourses.length,
        });
      } catch (err) {
        console.error('Teacher dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome, {user?.name} {user?.department ? `| ${user.department}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/teacher/courses"
          className="card flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <FaGraduationCap className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            <p className="text-xs text-gray-500">My Courses</p>
          </div>
        </Link>

        <Link
          to="/teacher/courses"
          className="card flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <FaUsers className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
            <p className="text-xs text-gray-500">Total Students</p>
          </div>
        </Link>

        <Link
          to="/teacher/tasks"
          className="card flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <FaTasks className="text-purple-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
            <p className="text-xs text-gray-500">Active Tasks</p>
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Courses</h2>
          <Link
            to="/teacher/courses"
            className="text-xs text-blue-600 hover:underline"
          >
            Manage Courses →
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            No courses assigned yet
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course) => {
              const courseId = getCourseId(course);
              const creditHours = getCreditHours(course);

              return (
                <div
                  key={courseId}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {course.code} • {creditHours} Credit Hours
                      </p>
                    </div>

                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {course.students?.length || 0} students
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Link
                      to={`/teacher/attendance?course=${courseId}`}
                      className="text-xs text-green-600 hover:underline flex items-center gap-1"
                    >
                      <FaCalendarCheck size={10} />
                      Attendance
                    </Link>

                    <Link
                      to={`/teacher/tasks?course=${courseId}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FaTasks size={10} />
                      Tasks
                    </Link>

                    <Link
                      to={`/teacher/grades?course=${courseId}`}
                      className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <FaBook size={10} />
                      Grades
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const getCourseId = (course) => course.id || course._id;

const getCreditHours = (course) => {
  return course.credit_hours || course.creditHours || 0;
};

export default TeacherDashboard;
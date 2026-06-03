import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaCalendarCheck, FaTasks, FaBook, FaChartBar, FaClock, FaCheckCircle } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState({ stats: { total: 0, present: 0, percentage: 0 } });
  const [tasks, setTasks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [c, a, t, g] = await Promise.all([
          api.get('/courses/my'),
          api.get('/attendance/student'),
          api.get('/tasks/my'),
          api.get('/grades/my'),
        ]);
        setCourses(c.data.courses || []);
        setAttendance(a.data);
        setTasks(t.data.tasks || []);
        setGrades(g.data.grades || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading dashboard..." /></div>;

  const pendingTasks = tasks.filter(t => !t.submission);
  const upcomingTasks = tasks.filter(t => !t.submission && new Date(t.dueDate) > new Date()).slice(0, 3);

  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{ data: [attendance.stats?.present || 0, (attendance.stats?.total || 0) - (attendance.stats?.present || 0)], backgroundColor: ['#22c55e', '#ef4444'], borderWidth: 0 }],
  };

  const gradeChartData = {
    labels: grades.map(g => g.course?.code || ''),
    datasets: [{ label: 'Total Score', data: grades.map(g => g.total || 0), backgroundColor: '#3b82f6', borderRadius: 6 }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.department} | Semester {user?.semester}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Courses', value: courses.length, icon: FaBook, color: 'blue' },
          { label: 'Attendance', value: `${attendance.stats?.percentage || 0}%`, icon: FaCalendarCheck, color: attendance.stats?.percentage >= 75 ? 'green' : 'red' },
          { label: 'Pending Tasks', value: pendingTasks.length, icon: FaTasks, color: 'yellow' },
          { label: 'CGPA', value: grades.length ? (grades.reduce((s, g) => s + (g.total || 0), 0) / grades.length / 25).toFixed(2) : '—', icon: FaChartBar, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
              <Icon className={`text-${color}-600 text-xl`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Attendance Overview</h2>
          <div className="w-40 mx-auto">
            <Doughnut data={attendanceChartData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
          </div>
          <p className="text-center mt-3 text-sm text-gray-600">
            {attendance.stats?.present}/{attendance.stats?.total} classes attended
          </p>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link to="/student/tasks" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-400"><FaCheckCircle size={32} className="mx-auto mb-2" /><p className="text-sm">No pending tasks!</p></div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(t => (
                <div key={t._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaClock className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.course?.name} • Due {new Date(t.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grade Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Course Scores</h2>
          {grades.length > 0 ? (
            <Bar data={gradeChartData} options={{ plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }} />
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">No grades published yet</div>
          )}
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Courses</h2>
          <span className="text-sm text-gray-500">{courses.length} enrolled</span>
        </div>
        {courses.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">Not enrolled in any course yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map(c => (
              <div key={c._id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 mt-1">{c.code} • {c.creditHours} Credit Hours</p>
                <p className="text-xs text-blue-600 mt-1">{c.teacher?.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

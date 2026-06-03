import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaUsers, FaGraduationCap, FaChalkboardTeacher, FaUserShield, FaClipboardList } from 'react-icons/fa';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, admins: 0, courses: 0, total: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => {
      setStats(data.stats || {});
      setRecentUsers(data.recentUsers || []);
    }).finally(() => setLoading(false));
  }, []);

  const userDistChart = {
    labels: ['Students', 'Teachers', 'Admins'],
    datasets: [{ data: [stats.students, stats.teachers, stats.admins], backgroundColor: ['#3b82f6', '#22c55e', '#8b5cf6'], borderWidth: 0 }],
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.students, icon: FaUsers, color: 'blue', to: '/admin/users?role=student' },
          { label: 'Total Teachers', value: stats.teachers, icon: FaChalkboardTeacher, color: 'green', to: '/admin/users?role=teacher' },
          { label: 'Active Courses', value: stats.courses, icon: FaGraduationCap, color: 'purple', to: '/admin/courses' },
          { label: 'Admins', value: stats.admins, icon: FaUserShield, color: 'orange', to: '/admin/users?role=admin' },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`text-${color}-600 text-xl`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">User Distribution</h2>
          <div className="w-48 mx-auto">
            <Doughnut data={userDistChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u._id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-sm">{u.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'teacher' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Manage Users', desc: 'Add, edit, remove users', icon: FaUsers, to: '/admin/users', color: 'blue' },
          { label: 'Manage Courses', desc: 'View all courses', icon: FaGraduationCap, to: '/admin/courses', color: 'green' },
          { label: 'Generate Reports', desc: 'Attendance, grades, submissions', icon: FaClipboardList, to: '/admin/reports', color: 'purple' },
        ].map(({ label, desc, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center mb-3 group-hover:bg-${color}-600 transition-colors`}>
              <Icon className={`text-${color}-600 group-hover:text-white text-xl`} />
            </div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

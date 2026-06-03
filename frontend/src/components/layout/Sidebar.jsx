import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome, FaCalendarCheck, FaTasks, FaBook, FaChartBar,
  FaComments, FaRobot, FaUsers, FaCog, FaSignOutAlt,
  FaGraduationCap, FaBullhorn, FaClipboardList
} from 'react-icons/fa';

const studentLinks = [
  { to: '/student/dashboard', icon: FaHome, label: 'Dashboard' },
  { to: '/student/attendance', icon: FaCalendarCheck, label: 'Attendance' },
  { to: '/student/tasks', icon: FaTasks, label: 'Tasks & Projects' },
  { to: '/student/materials', icon: FaBook, label: 'Learning Materials' },
  { to: '/student/grades', icon: FaChartBar, label: 'My Grades' },
  { to: '/chat', icon: FaComments, label: 'Chat' },
  { to: '/ai-assistant', icon: FaRobot, label: 'AI Assistant' },
  { to: '/notifications', icon: FaBullhorn, label: 'Notifications' },
];

const teacherLinks = [
  { to: '/teacher/dashboard', icon: FaHome, label: 'Dashboard' },
  { to: '/teacher/attendance', icon: FaCalendarCheck, label: 'Attendance' },
  { to: '/teacher/tasks', icon: FaTasks, label: 'Tasks & Projects' },
  { to: '/teacher/materials', icon: FaBook, label: 'Materials' },
  { to: '/teacher/grades', icon: FaChartBar, label: 'Grades' },
  { to: '/teacher/courses', icon: FaGraduationCap, label: 'My Courses' },
  { to: '/chat', icon: FaComments, label: 'Chat' },
  { to: '/ai-assistant', icon: FaRobot, label: 'AI Assistant' },
  { to: '/notifications', icon: FaBullhorn, label: 'Notifications' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
  { to: '/admin/users', icon: FaUsers, label: 'User Management' },
  { to: '/admin/courses', icon: FaGraduationCap, label: 'Courses' },
  { to: '/admin/reports', icon: FaClipboardList, label: 'Reports' },
  { to: '/chat', icon: FaComments, label: 'Chat' },
  { to: '/notifications', icon: FaBullhorn, label: 'Notifications' },
];

const roleLinks = { student: studentLinks, teacher: teacherLinks, admin: adminLinks };

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FaGraduationCap className="text-white text-lg" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">University CRM</h1>
            <p className="text-xs text-gray-500">UAF Academic Portal</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={16} />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} mb-1`}>
          <FaCog size={16} /><span className="text-sm">Profile</span>
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <FaSignOutAlt size={16} /><span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

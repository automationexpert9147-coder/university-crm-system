import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import StudentDashboard from './pages/student/StudentDashboard';
import Attendance from './pages/student/Attendance';
import Tasks from './pages/student/Tasks';
import Materials from './pages/student/Materials';
import Grades from './pages/student/Grades';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ManageAttendance from './pages/teacher/ManageAttendance';
import ManageTasks from './pages/teacher/ManageTasks';
import TeacherGrades from './pages/teacher/Grades';
import TeacherCourses from './pages/teacher/Courses';
import TeacherMaterials from './pages/teacher/Materials';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminCourses from './pages/admin/AdminCourses';
import Reports from './pages/admin/Reports';

import Chat from './pages/shared/Chat';
import AIAssistant from './pages/shared/AIAssistant';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';

const Wrap = ({ children, roles }) => (
  <ProtectedRoute allowedRoles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Student */}
            <Route path="/student/dashboard" element={<Wrap roles={['student']}><StudentDashboard /></Wrap>} />
            <Route path="/student/attendance" element={<Wrap roles={['student']}><Attendance /></Wrap>} />
            <Route path="/student/tasks" element={<Wrap roles={['student']}><Tasks /></Wrap>} />
            <Route path="/student/materials" element={<Wrap roles={['student']}><Materials /></Wrap>} />
            <Route path="/student/grades" element={<Wrap roles={['student']}><Grades /></Wrap>} />

            {/* Teacher */}
            <Route path="/teacher/dashboard" element={<Wrap roles={['teacher']}><TeacherDashboard /></Wrap>} />
            <Route path="/teacher/attendance" element={<Wrap roles={['teacher']}><ManageAttendance /></Wrap>} />
            <Route path="/teacher/tasks" element={<Wrap roles={['teacher']}><ManageTasks /></Wrap>} />
            <Route path="/teacher/grades" element={<Wrap roles={['teacher']}><TeacherGrades /></Wrap>} />
            <Route path="/teacher/courses" element={<Wrap roles={['teacher']}><TeacherCourses /></Wrap>} />
            <Route path="/teacher/materials" element={<Wrap roles={['teacher']}><TeacherMaterials /></Wrap>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<Wrap roles={['admin']}><AdminDashboard /></Wrap>} />
            <Route path="/admin/users" element={<Wrap roles={['admin']}><UserManagement /></Wrap>} />
            <Route path="/admin/courses" element={<Wrap roles={['admin']}><AdminCourses /></Wrap>} />
            <Route path="/admin/reports" element={<Wrap roles={['admin']}><Reports /></Wrap>} />

            {/* Shared */}
            <Route path="/chat" element={<Wrap><Chat /></Wrap>} />
            <Route path="/ai-assistant" element={<Wrap><AIAssistant /></Wrap>} />
            <Route path="/notifications" element={<Wrap><Notifications /></Wrap>} />
            <Route path="/profile" element={<Wrap><Profile /></Wrap>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

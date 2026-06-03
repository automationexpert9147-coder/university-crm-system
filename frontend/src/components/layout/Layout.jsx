import Sidebar from './Sidebar';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end gap-3 flex-shrink-0">
          <NotificationBell />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{user?.name}</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs capitalize">{user?.role}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

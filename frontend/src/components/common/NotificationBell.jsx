import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const { socket } = useSocket();

  const fetchCount = async () => {
    try {
      const { data } = await api.get('/notifications');
      setCount(data.unreadCount);
    } catch {}
  };

  useEffect(() => { fetchCount(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', () => setCount(c => c + 1));
    return () => socket.off('notification');
  }, [socket]);

  return (
    <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-blue-600">
      <FaBell size={20} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;

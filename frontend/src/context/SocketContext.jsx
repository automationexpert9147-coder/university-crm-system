import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        userId: String(user.id),
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      newSocket.emit('user_connected', String(user.id));
    });

    newSocket.on('online_users', (users) => {
      const normalizedUsers = (users || []).map((id) => String(id));
      setOnlineUsers(normalizedUsers);
    });

    newSocket.on('disconnect', () => {
      setOnlineUsers([]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('online_users');
      newSocket.off('disconnect');
      newSocket.disconnect();

      setSocket(null);
      setOnlineUsers([]);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
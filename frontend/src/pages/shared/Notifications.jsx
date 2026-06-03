import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaCalendarCheck,
  FaTasks,
  FaChartBar,
  FaBullhorn,
  FaPaperPlane,
} from 'react-icons/fa';

const typeIcon = {
  task: FaTasks,
  attendance: FaCalendarCheck,
  grade: FaChartBar,
  announcement: FaBullhorn,
  submission: FaTasks,
  general: FaBell,
};

const typeStyles = {
  task: { bg: 'bg-blue-100', text: 'text-blue-600' },
  attendance: { bg: 'bg-green-100', text: 'text-green-600' },
  grade: { bg: 'bg-purple-100', text: 'text-purple-600' },
  announcement: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  submission: { bg: 'bg-orange-100', text: 'text-orange-600' },
  general: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const emptyAnnouncementForm = {
  title: '',
  message: '',
  recipientMode: 'all',
};

const Notifications = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);
  const [sending, setSending] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      const { data } = await api.get('/admin/users?limit=1000');
      const allUsers = data.users || [];

      // Important:
      // Current admin ko remove nahi karna.
      // Is se "All Users" aur "All Admins" mein admin ko bhi notification milegi.
      setUsers(allUsers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const markRead = async (id) => {
    if (!id) return;

    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('All marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const getRecipients = () => {
    const mode = announcementForm.recipientMode;

    if (mode === 'custom') {
      return selectedUserIds.filter(Boolean);
    }

    if (mode === 'all') {
      return users.map((item) => getUserId(item)).filter(Boolean);
    }

    return users
      .filter((item) => item.role === mode)
      .map((item) => getUserId(item))
      .filter(Boolean);
  };

  const sendAnnouncement = async (event) => {
    event.preventDefault();

    const title = announcementForm.title.trim();
    const message = announcementForm.message.trim();
    const recipients = getRecipients();

    if (!title) {
      toast.error('Title is required');
      return;
    }

    if (!message) {
      toast.error('Message is required');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    try {
      setSending(true);

      await api.post('/notifications/announce', {
        recipients,
        title,
        message,
      });

      toast.success('Notification sent successfully');
      setAnnouncementForm(emptyAnnouncementForm);
      setSelectedUserIds([]);

      // Important:
      // Admin ko bhi agar notification mili hai to list immediately refresh ho jaye.
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const toggleSelectedUser = (id) => {
    if (!id) return;

    setSelectedUserIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  const filteredCustomUsers = users;

  if (loading) {
    return (
      <div className="card text-center py-12 text-gray-400">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaPaperPlane className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Send Notification</h2>
          </div>

          <form onSubmit={sendAnnouncement} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={announcementForm.title}
                onChange={(event) =>
                  setAnnouncementForm((form) => ({
                    ...form,
                    title: event.target.value,
                  }))
                }
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-24"
                value={announcementForm.message}
                onChange={(event) =>
                  setAnnouncementForm((form) => ({
                    ...form,
                    message: event.target.value,
                  }))
                }
                placeholder="Enter notification message"
              />
            </div>

            <div>
              <label className="label">Send To</label>
              <select
                className="input"
                value={announcementForm.recipientMode}
                onChange={(event) => {
                  setAnnouncementForm((form) => ({
                    ...form,
                    recipientMode: event.target.value,
                  }));
                  setSelectedUserIds([]);
                }}
              >
                <option value="all">All Users</option>
                <option value="student">All Students</option>
                <option value="teacher">All Teachers</option>
                <option value="admin">All Admins</option>
                <option value="custom">Select Specific Users</option>
              </select>
            </div>

            {announcementForm.recipientMode === 'custom' && (
              <div>
                <label className="label">Select Users</label>

                <div className="border rounded-xl max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {filteredCustomUsers.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">
                      No users found
                    </p>
                  ) : (
                    filteredCustomUsers.map((item) => {
                      const id = getUserId(item);
                      const checked = selectedUserIds.includes(id);

                      return (
                        <label
                          key={id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectedUser(id)}
                          />

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.email} • {item.role}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Selected users: {selectedUserIds.length}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="btn-primary flex items-center gap-2"
            >
              <FaPaperPlane size={14} />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
          {unread > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full ml-2">
              {unread}
            </span>
          )}
        </h1>

        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <FaCheckDouble size={12} />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="card text-center py-12">
            <FaBell size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = typeIcon[notification.type] || FaBell;
            const style = typeStyles[notification.type] || typeStyles.general;
            const isRead = getIsRead(notification);
            const createdAt = getCreatedAt(notification);

            return (
              <div
                key={getNotificationId(notification)}
                className={`card flex items-start gap-4 transition-all ${
                  !isRead ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  <Icon className={`${style.text} text-base`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      !isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {notification.title || 'Notification'}
                  </p>

                  <p className="text-sm text-gray-500 mt-0.5">
                    {notification.message || ''}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-gray-400">
                      {createdAt ? new Date(createdAt).toLocaleString() : ''}
                    </p>

                    {notification.sender && (
                      <p className="text-xs text-gray-400">
                        from {notification.sender.name}
                      </p>
                    )}
                  </div>
                </div>

                {!isRead && (
                  <button
                    onClick={() => markRead(getNotificationId(notification))}
                    className="text-blue-500 hover:text-blue-700 p-1 flex-shrink-0"
                    title="Mark as read"
                  >
                    <FaCheck size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const getNotificationId = (notification) => notification.id || notification._id;

const getUserId = (item) => item.id || item._id;

const getIsRead = (notification) => {
  if (typeof notification.is_read === 'boolean') return notification.is_read;
  if (typeof notification.isRead === 'boolean') return notification.isRead;
  return false;
};

const getCreatedAt = (notification) =>
  notification.created_at || notification.createdAt;

export default Notifications;
const supabase = require('../config/supabase');

const notifyAdmins = async ({
  senderId = null,
  type = 'general',
  title,
  message,
  io = null,
  excludeUserId = null,
}) => {
  try {
    if (!title || !message) return { success: false, count: 0 };

    let query = supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data: admins, error: adminError } = await query;

    if (adminError) throw adminError;

    if (!admins || admins.length === 0) {
      return { success: true, count: 0 };
    }

    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      sender_id: senderId,
      type,
      title,
      message,
      is_read: false,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) throw notificationError;

    if (io) {
      admins.forEach((admin) => {
        io.to(admin.id).emit('notification', {
          type,
          title,
          message,
        });
      });
    }

    return { success: true, count: admins.length };
  } catch (err) {
    console.error('Notify admins error:', err.message);
    return { success: false, count: 0, error: err.message };
  }
};

module.exports = notifyAdmins;
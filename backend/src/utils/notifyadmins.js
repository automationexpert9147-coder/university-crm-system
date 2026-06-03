const supabase = require('../config/supabase');

const notifyAdmins = async (...args) => {
  try {
    let req = null;
    let payload = {};

    if (args.length === 2) {
      req = args[0];
      payload = args[1] || {};
    } else {
      payload = args[0] || {};
    }

    const {
      senderId = null,
      type = 'announcement',
      title = 'New Notification',
      message = '',
      excludeUserId = null,
    } = payload;

    let query = supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data: admins, error: adminError } = await query;

    if (adminError) throw adminError;

    if (!admins || admins.length === 0) {
      return {
        success: true,
        count: 0,
      };
    }

    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      sender_id: senderId,
      type,
      title,
      message,
      is_read: false,
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    const io = req?.io;

    if (io) {
      admins.forEach((admin) => {
        io.to(String(admin.id)).emit('notification', {
          type,
          title,
          message,
        });
      });
    }

    return {
      success: true,
      count: admins.length,
    };
  } catch (err) {
    console.error('Notify admins error:', err.message);

    return {
      success: false,
      message: err.message,
    };
  }
};

module.exports = notifyAdmins;
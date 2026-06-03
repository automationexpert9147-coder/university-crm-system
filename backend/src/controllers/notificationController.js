const supabase = require('../config/supabase');

exports.getMyNotifications = async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, sender:users!sender_id(id, name)')
      .eq('user_id', req.user.id)
      .order('created_at', {
        ascending: false,
      })
      .limit(50);

    if (error) throw error;

    const unreadCount = (notifications || []).filter(
      (notification) => !notification.is_read
    ).length;

    res.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Marked as read',
    });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sendAnnouncement = async (req, res) => {
  try {
    const { recipients, title, message } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients are required',
      });
    }

    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

    if (uniqueRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid recipients are required',
      });
    }

    const notifications = uniqueRecipients.map((recipientId) => ({
      user_id: recipientId,
      sender_id: req.user.id,
      type: 'announcement',
      title: title.trim(),
      message: message.trim(),
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) throw error;

    if (req.io) {
      uniqueRecipients.forEach((recipientId) => {
        req.io.to(recipientId).emit('notification', {
          type: 'announcement',
          title: title.trim(),
          message: message.trim(),
        });
      });
    }

    res.json({
      success: true,
      message: `Announcement sent to ${uniqueRecipients.length} user(s)`,
    });
  } catch (err) {
    console.error('Send announcement error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
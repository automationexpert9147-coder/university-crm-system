const supabase = require('../config/supabase');

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId || !roomId.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat',
      });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(id, name, role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      messages: messages || [],
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.saveMessage = async (req, res) => {
  try {
    const { roomId, content, type } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and message content are required',
      });
    }

    if (!roomId.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this chat',
      });
    }

    const ids = roomId.split('_');
    const receiverId = ids.find((id) => id !== req.user.id);

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver not found for this room',
      });
    }

    const { data: receiver, error: receiverError } = await supabase
      .from('users')
      .select('id')
      .eq('id', receiverId)
      .maybeSingle();

    if (receiverError) throw receiverError;

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver user not found',
      });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: req.user.id,
        receiver_id: receiverId,
        content,
        type: type || 'text',
      })
      .select('*, sender:users!sender_id(id, name, role)')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    console.error('Save message error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getContacts = async (req, res) => {
  try {
    let query = supabase
      .from('users')
      .select('id, name, email, role, department, profile_image, roll_number')
      .eq('is_active', true)
      .neq('id', req.user.id);

    if (req.user.role === 'student') {
      query = query.in('role', ['teacher', 'admin']);
    } else if (req.user.role === 'teacher') {
      query = query.in('role', ['student', 'admin', 'teacher']);
    }

    const { data: contacts, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      contacts: contacts || [],
    });
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getRoomId = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const { data: otherUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', otherUserId)
      .maybeSingle();

    if (error) throw error;

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const roomId = [req.user.id, otherUserId].sort().join('_');

    res.json({
      success: true,
      roomId,
    });
  } catch (err) {
    console.error('Get room id error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
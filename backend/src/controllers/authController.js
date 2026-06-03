const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');
const notifyAdmins = require('../utils/notifyAdmins');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department, semester } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        roll_number: rollNumber,
        department,
        semester: semester ? String(semester) : null,
      })
      .select('id, name, email, role, department, semester, roll_number')
      .single();

    if (error) throw error;

    if (user.role === 'student' || user.role === 'teacher') {
      await notifyAdmins({
        senderId: user.id,
        type: 'general',
        title: `New ${user.role} registered`,
        message: `${user.name} has registered as a ${user.role}.`,
        io: req.io,
      });
    }

    const token = signToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user || error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Contact admin.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = signToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        rollNumber: user.roll_number,
        profileImage: user.profile_image,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, department, semester } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        phone,
        department,
        semester: semester ? String(semester) : null,
      })
      .eq('id', req.user.id)
      .select('id, name, email, role, department, semester, phone, profile_image')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password incorrect',
      });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await supabase
      .from('users')
      .update({ password: hashed })
      .eq('id', req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', req.body.email)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with that email',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('users')
      .update({
        reset_password_token: hashedToken,
        reset_password_expire: expire,
      })
      .eq('id', user.id);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `University CRM <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset',
        text: `Reset your password: ${resetUrl}`,
      });

      res.json({
        success: true,
        message: 'Reset email sent',
      });
    } catch {
      await supabase
        .from('users')
        .update({
          reset_password_token: null,
          reset_password_expire: null,
        })
        .eq('id', user.id);

      res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('reset_password_token', hashedToken)
      .gt('reset_password_expire', new Date().toISOString())
      .maybeSingle();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const hashed = await bcrypt.hash(req.body.password, 12);

    await supabase
      .from('users')
      .update({
        password: hashed,
        reset_password_token: null,
        reset_password_expire: null,
      })
      .eq('id', user.id);

    const token = signToken(user.id);

    res.json({
      success: true,
      token,
      message: 'Password reset successful',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// ─── Verify JWT Token ─────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from DB
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, full_name, is_active, is_verified')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// ─── Role-Based Authorization ─────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of: ${roles.join(', ')} role.`
      });
    }
    next();
  };
};

// ─── Doctor Must Be Verified ──────────────────────────────────
const requireVerified = (req, res, next) => {
  if (req.user.role === 'doctor' && !req.user.is_verified) {
    return res.status(403).json({
      error: 'Doctor account pending admin verification.'
    });
  }
  next();
};

module.exports = { authenticate, authorize, requireVerified };

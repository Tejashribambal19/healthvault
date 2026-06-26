// src/middleware/error.middleware.js
const { supabaseAdmin } = require('../config/supabase');

// ─── Global Error Handler ─────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// ─── Audit Logger ─────────────────────────────────────────────
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Log after response is sent
    res.on('finish', async () => {
      if (res.statusCode < 400 && req.user) {
        try {
          await supabaseAdmin.from('audit_logs').insert({
            user_id:     req.user.id,
            action,
            resource,
            resource_id: req.params.id || null,
            ip_address:  req.ip,
            metadata:    { method: req.method, path: req.path }
          });
        } catch (e) {
          // Don't fail the request due to audit error
          console.error('Audit log error:', e.message);
        }
      }
    });
    next();
  };
};

// ─── Validate Required Fields ─────────────────────────────────
const validateBody = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { errorHandler, auditLog, validateBody };

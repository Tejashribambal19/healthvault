// src/routes/chatbot.routes.js
const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getChatSessions } = require('../controllers/chatbot.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Chatbot is public — but history requires login
router.post('/message',  (req, res, next) => {
  // Optionally attach user if token provided
  const auth = req.headers.authorization;
  if (auth) {
    authenticate(req, res, next);
  } else {
    next();
  }
}, sendMessage);

router.get('/history',   authenticate, getChatHistory);
router.get('/sessions',  authenticate, getChatSessions);

module.exports = router;

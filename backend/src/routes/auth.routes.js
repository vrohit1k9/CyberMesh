const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Brute-force protection on authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
});

// Public endpoints
router.post('/login', authLimiter, authController.login);

// Protected endpoints
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

// Admin-only endpoints
router.post('/register', authenticateToken, requireRole('ADMIN'), authController.register);

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');
const { logAuditEvent } = require('../services/audit.service');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Investigator / Analyst / Admin Login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both username and password are required'
        }
      });
    }

    // Query user with role
    const userRes = await query(`
      SELECT u.user_id, u.username, u.password_hash, u.email, u.full_name, u.badge_number, u.is_active,
             r.role_id, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE LOWER(u.username) = LOWER($1)
    `, [username.trim()]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect username or password'
        }
      });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'This investigator account is deactivated. Contact system administrator.'
        }
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect username or password'
        }
      });
    }

    // Generate JWT
    const payload = {
      userId: user.user_id,
      username: user.username,
      roleName: user.role_name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Record audit event
    await logAuditEvent({
      userId: user.user_id,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: user.user_id,
      metadata: { badgeNumber: user.badge_number, role: user.role_name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          badgeNumber: user.badge_number,
          role: user.role_name
        }
      }
    });
  } catch (error) {
    console.error('[Auth Controller] Login failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during authentication'
      }
    });
  }
}

/**
 * Register new investigator (Admin only)
 */
async function register(req, res) {
  try {
    const { username, password, email, fullName, roleName, badgeNumber } = req.body;

    if (!username || !password || !email || !fullName || !roleName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required registration parameters'
        }
      });
    }

    // Verify role exists
    const roleRes = await query('SELECT role_id FROM roles WHERE role_name = $1', [roleName.toUpperCase()]);
    if (roleRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Role ${roleName} does not exist. Available: ADMIN, INVESTIGATOR, ANALYST`
        }
      });
    }

    const roleId = roleRes.rows[0].role_id;
    const passwordHash = await bcrypt.hash(password, 10);

    const insertRes = await query(`
      INSERT INTO users (username, password_hash, role_id, email, full_name, badge_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, username, email, full_name, badge_number
    `, [username.trim(), passwordHash, roleId, email.trim(), fullName.trim(), badgeNumber || null]);

    const newUser = insertRes.rows[0];

    // Record audit event
    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'REGISTER_USER',
      resource: 'USER',
      resourceId: newUser.user_id,
      metadata: { createdUsername: newUser.username, role: roleName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          ...newUser,
          role: roleName.toUpperCase()
        }
      }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this username or email already exists'
        }
      });
    }
    console.error('[Auth Controller] Register failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not register user'
      }
    });
  }
}

/**
 * Logout and record audit trail
 */
async function logout(req, res) {
  try {
    if (req.user) {
      await logAuditEvent({
        userId: req.user.userId,
        action: 'LOGOUT',
        resource: 'USER',
        resourceId: req.user.userId,
        metadata: { username: req.user.username },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Session closed successfully'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: error.message }
    });
  }
}

/**
 * Returns current authenticated user profile
 */
async function getCurrentUser(req, res) {
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}

module.exports = {
  login,
  register,
  logout,
  getCurrentUser
};

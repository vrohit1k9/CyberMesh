const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cybermesh_super_secret_jwt_key_academic_demo_2026';

/**
 * Authenticates request via Bearer JWT token in Authorization header
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid format'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch active user and role details from database
    const userRes = await query(`
      SELECT u.user_id, u.username, u.email, u.full_name, u.badge_number, u.is_active,
             r.role_id, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1 AND u.is_active = TRUE
    `, [decoded.userId]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session invalid or user has been deactivated'
        }
      });
    }

    const user = userRes.rows[0];
    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      badgeNumber: user.badge_number,
      roleId: user.role_id,
      roleName: user.role_name
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED_OR_INVALID',
        message: 'Security token has expired or signature verification failed'
      }
    });
  }
}

/**
 * Role-Based Access Control (RBAC) guard
 * @param  {...string} allowedRoles 
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user.roleName}`
        }
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};

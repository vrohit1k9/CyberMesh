const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);
// Restricted to Admins and Investigators
router.get('/', requireRole('ADMIN', 'INVESTIGATOR'), auditController.getAuditLogs);

module.exports = router;

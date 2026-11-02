const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/:id/risk', riskController.getCaseRisk);
router.post('/:id/recalculate-risk', requireRole('ADMIN', 'INVESTIGATOR'), riskController.recalculateCaseRisk);

module.exports = router;

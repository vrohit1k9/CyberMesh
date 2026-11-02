const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case.controller');
const aiController = require('../controllers/ai.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);
router.patch('/:id/status', requireRole('ADMIN', 'INVESTIGATOR'), caseController.updateCaseStatus);
router.post('/:id/ai-summary', requireRole('ADMIN', 'INVESTIGATOR'), aiController.generateCaseAiSummary);

module.exports = router;

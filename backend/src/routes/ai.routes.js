const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/extract', aiController.extractEntities);
router.post('/classify', aiController.classifyComplaint);
router.post('/rag-analyze', aiController.ragAnalyze);
router.post('/correlate', aiController.correlateAndSolve);

module.exports = router;

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/extract', aiController.extractEntities);
router.post('/classify', aiController.classifyComplaint);

module.exports = router;

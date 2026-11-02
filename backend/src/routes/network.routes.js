const express = require('express');
const router = express.Router();
const networkController = require('../controllers/network.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/network/global', networkController.getGlobalNetworks);
router.get('/:id/network', networkController.getCaseNetwork);

module.exports = router;

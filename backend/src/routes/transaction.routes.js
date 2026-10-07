const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;

const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All complaint routes require valid authentication
router.use(authenticateToken);

router.get('/', complaintController.getComplaints);
router.post('/', requireRole('ADMIN', 'INVESTIGATOR'), complaintController.createComplaint);
router.get('/:id', complaintController.getComplaintById);
router.put('/:id', requireRole('ADMIN', 'INVESTIGATOR'), complaintController.updateComplaint);
router.delete('/:id', requireRole('ADMIN'), complaintController.deleteComplaint);

module.exports = router;

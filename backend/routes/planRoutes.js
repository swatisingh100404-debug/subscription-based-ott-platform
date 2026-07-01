const express = require('express');
const router = express.Router();
const { getPlans, createPlan, subscribeToPlan, getUserTransactions } = require('../controllers/planController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/', getPlans);
router.get('/transactions', protect, getUserTransactions);
router.post('/', protect, admin, createPlan);
router.post('/subscribe', protect, subscribeToPlan);

module.exports = router;

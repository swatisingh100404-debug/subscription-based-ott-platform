const Plan = require('../models/Plan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get all subscription plans
// @route   GET /api/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({});
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create plan (Admin only)
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
  const { name, price, features, durationMonths } = req.body;

  try {
    const planExists = await Plan.findOne({ name });
    if (planExists) {
      return res.status(400).json({ message: 'Plan with this name already exists' });
    }

    const plan = new Plan({
      name,
      price: Number(price),
      features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()),
      durationMonths: Number(durationMonths) || 1,
    });

    const createdPlan = await plan.save();
    res.status(201).json(createdPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Subscribe to a plan (Mock payment check)
// @route   POST /api/plans/subscribe
// @access  Private
const subscribeToPlan = async (req, res) => {
  const { planId, cardNumber, expiry, cvv } = req.body;

  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mock Card Validation (Any card is accepted, but let's make it look like we check it)
    if (cardNumber && cardNumber.replace(/\s/g, '').length < 16) {
      return res.status(400).json({ message: 'Invalid card number format' });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + plan.durationMonths);

    // Save user subscription status
    user.subscription.plan = plan._id;
    user.subscription.status = 'active';
    user.subscription.startDate = startDate;
    user.subscription.endDate = endDate;
    await user.save();

    // Create a transaction record
    const txnId = 'TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const transaction = new Transaction({
      user: user._id,
      plan: plan._id,
      amount: plan.price,
      paymentStatus: 'success',
      paymentMethod: 'mock_card',
      transactionId: txnId,
    });
    await transaction.save();

    // Populate user's subscription details to return
    const updatedUser = await User.findById(user._id).populate('subscription.plan');

    res.status(200).json({
      message: 'Subscription successful',
      subscription: updatedUser.subscription,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('plan')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlans,
  createPlan,
  subscribeToPlan,
  getUserTransactions,
};


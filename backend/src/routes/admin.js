const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router();

router.use(auth);

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Allow admin or operator (for limited, non-sensitive views)
const adminOrOperator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    return res.status(403).json({ message: 'Admin or operator access required' });
  }
  next();
};

// Get all operators with stats (admin only)
router.get('/operators', adminOnly, async (req, res, next) => {
  try {
    const operators = await User.find({ role: 'operator' }).select('-passwordHash');
    const operatorsWithStats = await Promise.all(
      operators.map(async (op) => {
        const inProgressCount = await ServiceRequest.countDocuments({
          assignedOperator: op._id,
          status: 'in-progress'
        });
        return {
          ...op.toObject(),
          tasksInProgress: inProgressCount
        };
      })
    );
    res.json(operatorsWithStats);
  } catch (e) {
    next(e);
  }
});

// Lightweight operator list for assignment (admin + operators)
router.get('/operators-lite', adminOrOperator, async (req, res, next) => {
  try {
    const operators = await User.find({ role: 'operator' }).select('-passwordHash');
    const operatorsWithStats = await Promise.all(
      operators.map(async (op) => {
        const inProgressCount = await ServiceRequest.countDocuments({
          assignedOperator: op._id,
          status: 'in-progress'
        });
        return {
          _id: op._id,
          name: op.name,
          email: op.email,
          isActive: op.isActive,
          tasksInProgress: inProgressCount
        };
      })
    );
    res.json(operatorsWithStats);
  } catch (e) {
    next(e);
  }
});

// Add new operator
router.post('/operators', adminOnly, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if operator already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create operator with provided password
    const passwordHash = await User.hashPassword(password);

    const operator = await User.create({
      name,
      email,
      passwordHash,
      role: 'operator'
    });

    res.status(201).json({
      id: operator._id,
      name: operator.name,
      email: operator.email,
      role: operator.role,
      message: 'Operator account created successfully'
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    next(e);
  }
});

// Update operator status
router.patch('/operators/:id', adminOnly, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const operator = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-passwordHash');
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    res.json(operator);
  } catch (e) {
    next(e);
  }
});

// Delete operator
router.delete('/operators/:id', adminOnly, async (req, res, next) => {
  try {
    const operator = await User.findByIdAndDelete(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    res.json({ message: 'Operator deleted successfully' });
  } catch (e) {
    next(e);
  }
});

// Get operator stats with tasks
router.get('/operators/:id/stats', adminOnly, async (req, res, next) => {
  try {
    const operator = await User.findById(req.params.id).select('-passwordHash');
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    
    const completed = await ServiceRequest.countDocuments({
      assignedOperator: req.params.id,
      status: 'completed'
    });
    
    const inProgress = await ServiceRequest.countDocuments({
      assignedOperator: req.params.id,
      status: 'in-progress'
    });

    // Get in-progress tasks
    const inProgressTasks = await ServiceRequest.find({
      assignedOperator: req.params.id,
      status: 'in-progress'
    })
      .populate('createdBy', 'name email')
      .sort({ startedAt: -1 })
      .limit(50);

    // Get completed tasks (recent 50)
    const completedTasks = await ServiceRequest.find({
      assignedOperator: req.params.id,
      status: 'completed'
    })
      .populate('createdBy', 'name email')
      .sort({ completedAt: -1 })
      .limit(50);

    // compute additional metrics
    const totalDelay = completedTasks.reduce((sum, t) => sum + (t.delayMinutes || 0), 0);
    const avgDelay = completedTasks.length ? totalDelay / completedTasks.length : 0;

    const serviceCounts = {};
    completedTasks.forEach((t) => {
      serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1;
    });

    const queueCount = await ServiceRequest.countDocuments({
      assignedOperator: req.params.id,
      status: { $in: ['pending', 'in-progress'] }
    });

    const stats = {
      operatorId: operator._id,
      name: operator.name,
      email: operator.email,
      tasksCompleted: completed,
      tasksInProgress: inProgress,
      averageRating: operator.averageRating,
      totalRatings: operator.totalRatings,
      isActive: operator.isActive,
      inProgressTasks,
      completedTasks,
      avgDelayMinutes: avgDelay,
      serviceCounts,
      queueLength: queueCount
    };
    
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

// Get completed tasks
router.get('/tasks/completed', adminOnly, async (req, res, next) => {
  try {
    const completedTasks = await ServiceRequest.find({ status: 'completed' })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ completedAt: -1 });
    res.json(completedTasks);
  } catch (e) {
    next(e);
  }
});

// Get in-progress tasks
router.get('/tasks/in-progress', adminOnly, async (req, res, next) => {
  try {
    const inProgressTasks = await ServiceRequest.find({ status: 'in-progress' })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ startedAt: -1 });
    res.json(inProgressTasks);
  } catch (e) {
    next(e);
  }
});

// Get pending tasks (not assigned)
router.get('/tasks/pending', adminOnly, async (req, res, next) => {
  try {
    const pendingTasks = await ServiceRequest.find({ status: 'pending', assignedOperator: null })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(pendingTasks);
  } catch (e) {
    next(e);
  }
});

// Assign operator to customer manually
router.patch('/tasks/:id/assign-operator', adminOnly, async (req, res, next) => {
  try {
    const { operatorId } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({ message: 'Operator ID is required' });
    }
    
    // Verify operator exists
    const operator = await User.findById(operatorId);
    if (!operator || operator.role !== 'operator') {
      return res.status(400).json({ message: 'Invalid operator' });
    }
    
    const task = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedOperator: operatorId },
      { new: true }
    ).populate('createdBy', 'name email').populate('assignedOperator', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (e) {
    next(e);
  }
});

// Get operator's current queue (up to 10 tasks)
router.get('/operators/:id/queue', adminOnly, async (req, res, next) => {
  try {
    const queueTasks = await ServiceRequest.find({
      assignedOperator: req.params.id,
      status: { $in: ['pending', 'in-progress'] }
    })
      .populate('createdBy', 'name email')
      .limit(10)
      .sort({ createdAt: 1 });
    
    res.json(queueTasks);
  } catch (e) {
    next(e);
  }
});

// Get service history
router.get('/service-history', adminOnly, async (req, res, next) => {
  try {
    const history = await ServiceRequest.find()
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (e) {
    next(e);
  }
});

// Get admin stats
router.get('/stats', adminOnly, async (req, res, next) => {
  try {
    const totalOperators = await User.countDocuments({ role: 'operator' });
    const totalCompleted = await ServiceRequest.countDocuments({ status: 'completed' });
    const totalPending = await ServiceRequest.countDocuments({ status: 'pending' });
    const totalInProgress = await ServiceRequest.countDocuments({ status: 'in-progress' });
    
    const operators = await User.find({ role: 'operator' });
    let averageRating = 0;
    if (operators.length > 0) {
      const totalRating = operators.reduce((sum, op) => sum + op.averageRating, 0);
      averageRating = (totalRating / operators.length).toFixed(1);
    }
    
    const stats = {
      totalOperators,
      totalCompleted,
      totalPending,
      totalInProgress,
      averageRating,
      activeOperators: await User.countDocuments({ role: 'operator', isActive: true })
    };
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

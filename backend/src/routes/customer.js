const express = require('express');
const auth = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

const router = express.Router();

router.use(auth);

// Helper function to find available operator
const findAvailableOperator = async () => {
  // Get all active operators
  const activeOperators = await User.find({ role: 'operator', isActive: true });
  
  if (activeOperators.length === 0) {
    return null;
  }
  
  // For each operator, count their current queue
  const operatorQueues = await Promise.all(
    activeOperators.map(async (op) => {
      const queueCount = await ServiceRequest.countDocuments({
        assignedOperator: op._id,
        status: { $in: ['pending', 'in-progress'] }
      });
      return { operator: op, queueCount };
    })
  );
  
  // Find operator with smallest queue
  const availableOp = operatorQueues.reduce((prev, current) => 
    prev.queueCount <= current.queueCount ? prev : current
  );
  
  // If smallest queue is less than 10, assign to this operator
  if (availableOp.queueCount < 10) {
    return availableOp.operator;
  }
  
  return null; // All operators are at capacity
};

// Generate token for service
router.post('/token/generate', async (req, res, next) => {
  try {
    const { customerName, email, phone, company, vehicle, service: serviceId } = req.body;

    if (!customerName || !email || !phone || !company || !vehicle || !serviceId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create token ID
    const tokenId = `TOKEN-${Date.now()}`;
    
    // Find available operator
    const availableOperator = await findAvailableOperator();

    // Create a service request/token
    const serviceRequest = await ServiceRequest.create({
      tokenId,
      customerName,
      email,
      phone,
      company,
      vehicle,
      service: serviceId,
      status: availableOperator ? 'pending' : 'pending',
      createdBy: req.user._id,
      assignedOperator: availableOperator ? availableOperator._id : null
    });

    res.status(201).json({
      tokenId: serviceRequest.tokenId,
      customerName: serviceRequest.customerName,
      service: serviceRequest.service,
      status: serviceRequest.status,
      assignedOperator: availableOperator ? { id: availableOperator._id, name: availableOperator.name } : null,
      waitStatus: availableOperator ? 'assigned' : 'waiting',
      createdAt: serviceRequest.createdAt
    });
  } catch (e) {
    next(e);
  }
});

// Check queue status and get available operators
router.get('/queue-status', async (req, res, next) => {
  try {
    const operators = await User.find({ role: 'operator', isActive: true }).select('name email');
    
    const operatorStatuses = await Promise.all(
      operators.map(async (op) => {
        const queueCount = await ServiceRequest.countDocuments({
          assignedOperator: op._id,
          status: { $in: ['pending', 'in-progress'] }
        });
        return {
          id: op._id,
          name: op.name,
          email: op.email,
          queueCount,
          isAvailable: queueCount < 10
        };
      })
    );
    
    res.json({
      operators: operatorStatuses,
      availableCount: operatorStatuses.filter(op => op.isAvailable).length
    });
  } catch (e) {
    next(e);
  }
});

// Get customer's recent task (the task they just generated token for)
router.get('/customer/recent-task', async (req, res, next) => {
  try {
    const recentTask = await ServiceRequest.findOne({ createdBy: req.user._id })
      .populate('assignedOperator', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(recentTask || null);
  } catch (e) {
    next(e);
  }
});

// Get all pending service requests (for operators)
router.get('/requests/pending', async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ createdAt: 1 });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Get all in-progress service requests (for operators)
router.get('/requests/in-progress', async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ status: 'in-progress', assignedOperator: req.user._id })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ startedAt: -1 });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Get all completed service requests
router.get('/requests/completed', async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ status: 'completed' })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ completedAt: -1 });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Get operator's completed tasks (recent within a month)
router.get('/requests/operator/completed-recent', async (req, res, next) => {
  try {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const requests = await ServiceRequest.find({
      assignedOperator: req.user._id,
      status: 'completed',
      completedAt: { $gte: oneMonthAgo }
    })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ completedAt: -1 });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Get operator's completed tasks (history within a year)
router.get('/requests/operator/completed-history', async (req, res, next) => {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const requests = await ServiceRequest.find({
      assignedOperator: req.user._id,
      status: 'completed',
      completedAt: { $gte: oneYearAgo }
    })
      .populate('createdBy', 'name email')
      .populate('assignedOperator', 'name email')
      .sort({ completedAt: -1 });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

// Accept a service request (operator accepts task)
router.patch('/requests/:id/accept', async (req, res, next) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'in-progress',
        assignedOperator: req.user._id,
        startedAt: new Date()
      },
      { new: true }
    ).populate('createdBy', 'name email').populate('assignedOperator', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json(request);
  } catch (e) {
    next(e);
  }
});

// Complete a service request (operator completes task)
router.patch('/requests/:id/complete', async (req, res, next) => {
  try {
    const { operatorNotes } = req.body;
    
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        completedAt: new Date(),
        operatorNotes
      },
      { new: true }
    ).populate('createdBy', 'name email').populate('assignedOperator', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Update operator stats
    if (request.assignedOperator) {
      await User.findByIdAndUpdate(
        request.assignedOperator._id,
        { $inc: { tasksCompleted: 1 } }
      );
    }

    res.json(request);
  } catch (e) {
    next(e);
  }
});

// Edit a service request (customer edits pending tasks only)
router.patch('/requests/:id/edit', auth, async (req, res, next) => {
  try {
    const { vehicle, phone, company, service } = req.body;
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Only customer who created the request can edit
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the customer can edit this request' });
    }

    // Can only edit pending tasks
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Can only edit pending tasks' });
    }

    // Update allowed fields
    if (vehicle) request.vehicle = vehicle;
    if (phone) request.phone = phone;
    if (company) request.company = company;
    if (service) request.service = service;

    const updatedRequest = await request.save();
    await updatedRequest.populate('createdBy', 'name email').populate('assignedOperator', 'name email');

    res.json(updatedRequest);
  } catch (e) {
    next(e);
  }
});

// Delete a service request (operator can delete their tasks, customer can delete pending)
router.delete('/requests/:id', auth, async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization
    const isOperator = request.assignedOperator?.toString() === req.user._id.toString();
    const isCustomer = request.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOperator && !isCustomer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    // Operators can delete pending/in-progress, customers can delete pending
    if (isCustomer && request.status !== 'pending') {
      return res.status(400).json({ message: 'Customers can only delete pending tasks' });
    }

    if (isOperator && request.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete completed tasks' });
    }

    await ServiceRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Service request deleted successfully' });
  } catch (e) {
    next(e);
  }
});

// Reassign task to another operator (operator or admin)
router.patch('/requests/:id/reassign', auth, async (req, res, next) => {
  try {
    const { newOperatorId } = req.body;
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check authorization - only current operator or admin can reassign
    const isCurrentOperator = request.assignedOperator?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCurrentOperator && !isAdmin) {
      return res.status(403).json({ message: 'Only assigned operator or admin can reassign' });
    }

    // Can only reassign pending or in-progress tasks
    if (request.status === 'completed' || request.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reassign completed or cancelled tasks' });
    }

    // Verify new operator exists and is an operator
    const newOperator = await User.findOne({ _id: newOperatorId, role: 'operator' });
    if (!newOperator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    // Check if new operator has capacity (queue < 10)
    const operatorQueue = await ServiceRequest.countDocuments({
      assignedOperator: newOperatorId,
      status: { $in: ['pending', 'in-progress'] }
    });

    if (operatorQueue >= 10) {
      return res.status(400).json({ message: 'Target operator queue is full (10/10)' });
    }

    // Reassign the task
    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedOperator: newOperatorId },
      { new: true }
    ).populate('createdBy', 'name email').populate('assignedOperator', 'name email');

    res.json(updatedRequest);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

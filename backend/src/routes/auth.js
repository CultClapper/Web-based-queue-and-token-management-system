const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ id: user._id, email: user.email });
  } catch (e) {
    // Check if it's a MongoDB connection error
    if (e.name === 'MongoServerError' || e.name === 'MongoNetworkError' || e.message?.includes('Mongo')) {
      return res.status(500).json({ 
        message: 'Database connection error. Please check if MongoDB is running and configured correctly.' 
      });
    }
    // Check for validation errors
    if (e.name === 'ValidationError') {
      return res.status(400).json({ message: e.message });
    }
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;


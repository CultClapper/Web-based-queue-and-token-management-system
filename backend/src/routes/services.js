const express = require('express');
const auth = require('../middleware/auth');
const ServiceGroup = require('../models/ServiceGroup');
const Service = require('../models/Service');

const router = express.Router();

router.use(auth);

router.get('/groups', async (req, res, next) => {
  try {
    const groups = await ServiceGroup.find().sort({ priority: 1 });
    res.json(groups);
  } catch (e) {
    next(e);
  }
});

router.post('/groups', async (req, res, next) => {
  try {
    const group = await ServiceGroup.create({ ...req.body, owner: req.user._id });
    res.status(201).json(group);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const services = await Service.find().populate('group');
    res.json(services);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

module.exports = router;




const express = require('express');
const auth = require('../middleware/auth');
const ScheduleSlot = require('../models/ScheduleSlot');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = {};
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.startTime = { $gte: start, $lt: end };
    }
    const slots = await ScheduleSlot.find(query).populate('service');
    res.json(slots);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await ScheduleSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

module.exports = router;




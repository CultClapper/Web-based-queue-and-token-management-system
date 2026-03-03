const express = require('express');
const auth = require('../middleware/auth');
const TaktConfig = require('../models/TaktConfig');
const { getCurrentConfig, generateDaySlots } = require('../services/taktService');

const router = express.Router();

router.use(auth);

router.get('/config', async (req, res, next) => {
  try {
    const cfg = await getCurrentConfig();
    res.json(cfg);
  } catch (e) {
    next(e);
  }
});

router.put('/config', async (req, res, next) => {
  try {
    let cfg = await TaktConfig.findOne();
    if (!cfg) {
      cfg = await TaktConfig.create(req.body);
    } else {
      Object.assign(cfg, req.body);
      await cfg.save();
    }
    res.json(cfg);
  } catch (e) {
    next(e);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const { date } = req.body; // ISO string like 2025-12-30
    const slots = await generateDaySlots(date);
    res.json({ createdCount: slots.length });
  } catch (e) {
    next(e);
  }
});

module.exports = router;




const mongoose = require('mongoose');

const taktConfigSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Default Takt' },
    taktTimeMinutes: { type: Number, required: true }, // rhythm
    workingDayStart: { type: String, default: '08:00' },
    workingDayEnd: { type: String, default: '18:00' },
    timeZone: { type: String, default: 'Asia/Kolkata' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaktConfig', taktConfigSchema);




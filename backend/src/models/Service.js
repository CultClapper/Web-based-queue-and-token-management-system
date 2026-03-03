const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceGroup', required: true },
    description: String,
    durationMinutes: { type: Number, default: 60 },
    capacity: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'paused'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);




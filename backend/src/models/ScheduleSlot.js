const mongoose = require('mongoose');

const scheduleSlotSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    taktSequence: { type: Number, required: true },
    allocatedTo: { type: String }, // customer or order id
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'cancelled'],
      default: 'planned'
    }
  },
  { timestamps: true }
);

scheduleSlotSchema.index({ service: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('ScheduleSlot', scheduleSlotSchema);




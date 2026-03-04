const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String, required: true },
    vehicle: { type: String, required: true },
    service: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedOperator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    queuePosition: { type: Number }, // Position in operator's queue
    assignedAt: { type: Date }, // When operator claimed the task
    expectedDurationMinutes: { type: Number, default: 0 }, // Planned work time
    startedAt: { type: Date }, // When work actually began
    completedAt: { type: Date }, // When task was completed
    workDurationMinutes: { type: Number, default: 0 }, // calculated on completion
    delayMinutes: { type: Number, default: 0 }, // positive if finished late
    operatorNotes: { type: String } // Notes from operator
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

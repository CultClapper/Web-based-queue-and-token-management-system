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
    startedAt: { type: Date }, // When task started
    completedAt: { type: Date }, // When task was completed
    operatorNotes: { type: String } // Notes from operator
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

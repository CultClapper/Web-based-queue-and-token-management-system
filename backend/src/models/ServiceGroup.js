const mongoose = require('mongoose');

const serviceGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    priority: { type: Number, default: 2 }, // 1=high, 3=low
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceGroup', serviceGroupSchema);




const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleNumber: { type: String, required: true },
  weight: { type: Number, required: true },
  entryType: { type: String, enum: ['simulation', 'machine', 'manual'], required: true },
  cargoType: { type: String },
  buyer: { type: String },
  seller: { type: String },
  location: { type: String },
  notes: { type: String },
  isOverload: { type: Boolean, default: false },
  overloadPercentage: { type: Number, default: 0 },
  deviceId: { type: String },
  deviceType: { type: String, enum: ['usb', 'bluetooth', 'serial', 'esp32', 'arduino', 'api'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

weightLogSchema.index({ vehicle: 1, createdAt: -1 });
weightLogSchema.index({ entryType: 1 });
weightLogSchema.index({ createdBy: 1 });

module.exports = mongoose.model('WeightLog', weightLogSchema);
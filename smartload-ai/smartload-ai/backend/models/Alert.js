const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['overload', 'weight_mismatch', 'machine_disconnected', 'shipment_delay', 'high_risk', 'fraud_detected'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  vehicleNumber: { type: String },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

alertSchema.index({ createdFor: 1, isResolved: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ type: 1 });

module.exports = mongoose.model('Alert', alertSchema);
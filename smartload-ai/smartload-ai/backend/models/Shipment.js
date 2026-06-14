const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  cargoType: { type: String, required: true },
  buyer: { type: String, required: true },
  seller: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleNumber: { type: String, required: true },
  weight: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
  shipmentDate: { type: Date, required: true },
  deliveryDate: { type: Date },
  revenue: { type: Number, default: 0 },
  notes: { type: String },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  aiRecommendations: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

shipmentSchema.index({ shipmentId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ vehicle: 1 });
shipmentSchema.index({ createdBy: 1 });
shipmentSchema.index({ shipmentDate: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
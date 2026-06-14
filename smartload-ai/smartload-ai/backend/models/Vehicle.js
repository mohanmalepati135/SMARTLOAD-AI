const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  driverName: { type: String, required: true, trim: true },
  driverPhone: { type: String, required: true },
  vehicleType: { type: String, required: true, enum: ['truck', 'van', 'container', 'trailer', 'pickup'] },
  capacity: { type: Number, required: true, min: 0 },
  licenseNumber: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance', 'on_trip'], default: 'active' },
  currentWeight: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  totalCargoWeight: { type: Number, default: 0 },
  lastTripDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
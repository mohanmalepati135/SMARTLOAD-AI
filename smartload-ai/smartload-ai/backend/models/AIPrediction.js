const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
  type: { type: String, enum: ['revenue', 'weight_trend', 'risk_score', 'overload_prediction', 'fraud_detection'], required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  prediction: { type: mongoose.Schema.Types.Mixed, required: true },
  confidence: { type: Number, min: 0, max: 100 },
  actualValue: { type: mongoose.Schema.Types.Mixed },
  accuracy: { type: Number },
  features: { type: mongoose.Schema.Types.Mixed },
  createdFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('AIPrediction', aiPredictionSchema);
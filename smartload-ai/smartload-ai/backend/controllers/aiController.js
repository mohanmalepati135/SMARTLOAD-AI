
const AIEngine = require('../utils/aiEngine');
const WeightLog = require('../models/WeightLog');
const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const AIPrediction = require('../models/AIPrediction');

exports.getInsights = async (req, res) => {
  try {
    const { vehicleId, period = '7d' } = req.query;
    
    // Get weight logs for trend analysis
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(period));

    const weightLogs = await WeightLog.find({
      createdBy: req.user.id,
      ...(vehicleId && { vehicle: vehicleId }),
      createdAt: { $gte: dateFilter }
    }).sort({ createdAt: 1 });

    // Get shipment data for revenue prediction
    const shipments = await Shipment.find({
      createdBy: req.user.id,
      createdAt: { $gte: dateFilter }
    });

    // Weight trend analysis
    const weightTrend = AIEngine.analyzeWeightTrend(weightLogs, period);

    // Revenue prediction
    const revenueData = shipments.map(s => ({
      revenue: s.revenue,
      date: s.createdAt
    }));
    const revenuePrediction = AIEngine.predictRevenue(revenueData, 7);

    // Vehicle utilization
    const vehicles = await Vehicle.find({ createdBy: req.user.id });
    const utilizationData = vehicles.map(v => ({
      vehicle: v.vehicleNumber,
      utilization: v.capacity > 0 ? (v.currentWeight / v.capacity) * 100 : 0,
      status: v.status
    }));

    // Overload summary
    const overloadLogs = weightLogs.filter(w => w.isOverload);
    
    res.json({
      weightTrend,
      revenuePrediction,
      utilization: utilizationData,
      overloadSummary: {
        count: overloadLogs.length,
        totalOverload: overloadLogs.reduce((sum, w) => sum + (w.overloadPercentage || 0), 0),
        averageOverload: overloadLogs.length > 0 ? 
          overloadLogs.reduce((sum, w) => sum + (w.overloadPercentage || 0), 0) / overloadLogs.length : 0
      },
      totalAnalyzed: weightLogs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiskAnalysis = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ createdBy: req.user.id });
    const shipments = await Shipment.find({ 
      createdBy: req.user.id, 
      status: { $in: ['pending', 'in_transit'] } 
    });

    const riskData = [];

    for (const shipment of shipments) {
      const vehicle = vehicles.find(v => v._id.toString() === shipment.vehicle?.toString());
      if (!vehicle) continue;

      const weightLog = await WeightLog.findOne({ vehicle: vehicle._id }).sort({ createdAt: -1 });
      const riskScore = AIEngine.calculateRiskScore(shipment, vehicle, weightLog);
      
      riskData.push({
        shipmentId: shipment.shipmentId,
        vehicleNumber: vehicle.vehicleNumber,
        riskScore: riskScore.score,
        level: riskScore.level,
        factors: riskScore.factors,
        recommendations: AIEngine.generateRecommendations(vehicle, shipment, weightLog)
      });
    }

    res.json({
      risks: riskData.sort((a, b) => b.riskScore - a.riskScore),
      highRiskCount: riskData.filter(r => r.level === 'high').length,
      averageRisk: riskData.length > 0 ? 
        riskData.reduce((sum, r) => sum + r.riskScore, 0) / riskData.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ createdBy: req.user.id });
    const recommendations = [];

    for (const vehicle of vehicles) {
      const shipment = await Shipment.findOne({ 
        vehicle: vehicle._id,
        status: { $in: ['pending', 'in_transit'] }
      });
      
      const weightLog = await WeightLog.findOne({ vehicle: vehicle._id }).sort({ createdAt: -1 });
      const vehicleRecs = AIEngine.generateRecommendations(vehicle, shipment, weightLog);
      recommendations.push(...vehicleRecs.map(r => ({ ...r, vehicleNumber: vehicle.vehicleNumber })));
    }

    res.json({
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      total: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
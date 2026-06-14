const Vehicle = require('../models/Vehicle');
const Shipment = require('../models/Shipment');
const WeightLog = require('../models/WeightLog');
const Alert = require('../models/Alert');

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalVehicles = await Vehicle.countDocuments({ createdBy: userId });
    const pendingShipments = await Shipment.countDocuments({ createdBy: userId, status: 'pending' });
    const revenueData = await Shipment.aggregate([{ $match: { createdBy: req.user._id, status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$revenue' } } }]);
    const totalRevenue = revenueData[0]?.total || 0;
    const weightData = await WeightLog.aggregate([{ $match: { createdBy: req.user._id } }, { $group: { _id: null, total: { $sum: '$weight' } } }]);
    const totalCargoWeight = weightData[0]?.total || 0;
    const recentActivity = await Promise.all([
      WeightLog.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5).populate('vehicle', 'vehicleNumber'),
      Shipment.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5).populate('vehicle', 'vehicleNumber'),
      Alert.find({ createdFor: userId, isResolved: false }).sort({ createdAt: -1 }).limit(5)
    ]);
    const last30Days = new Date(); last30Days.setDate(last30Days.getDate() - 30);
    
    // Use $dateToString with format parameter for MongoDB 4.0+
    const dailyShipments = await Shipment.aggregate([
      { $match: { createdBy: req.user._id, createdAt: { $gte: last30Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$revenue' } } },
      { $sort: { _id: 1 } }
    ]);
    
    const dailyWeights = await WeightLog.aggregate([
      { $match: { createdBy: req.user._id, createdAt: { $gte: last30Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, totalWeight: { $sum: '$weight' }, avgWeight: { $avg: '$weight' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const vehicleStatusDist = await Vehicle.aggregate([{ $match: { createdBy: req.user._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const shipmentStatusDist = await Shipment.aggregate([{ $match: { createdBy: req.user._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ kpi: { totalVehicles, pendingShipments, totalRevenue, totalCargoWeight }, recentActivity: { weightLogs: recentActivity[0], shipments: recentActivity[1], alerts: recentActivity[2] }, analytics: { dailyShipments, dailyWeights, vehicleStatusDist, shipmentStatusDist } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
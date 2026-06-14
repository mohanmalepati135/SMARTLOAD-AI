//# backend/controllers/alertController.js
const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, isResolved, type } = req.query;
    const query = { createdFor: req.user.id };

    if (severity) query.severity = severity;
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .populate('vehicle', 'vehicleNumber')
      .populate('shipment', 'shipmentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({ createdFor: req.user.id, isResolved: false });

    res.json({
      alerts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, createdFor: req.user.id },
      { isResolved: true, resolvedAt: new Date(), resolvedBy: req.user.id },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlertStats = async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      { $match: { createdFor: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unresolved: { $sum: { $cond: [{ $eq: ['$isResolved', false] }, 1, 0] } },
          highSeverity: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } }
        }
      }
    ]);

    const byType = await Alert.aggregate([
      { $match: { createdFor: req.user._id, isResolved: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({ overall: stats[0] || {}, byType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
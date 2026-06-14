class AIEngine {
  static detectOverload(currentWeight, capacity) {
    if (!capacity || capacity <= 0) return { isOverload: false, percentage: 0 };
    const percentage = ((currentWeight - capacity) / capacity) * 100;
    return {
      isOverload: currentWeight > capacity,
      percentage: Math.max(0, parseFloat(percentage.toFixed(2))),
      severity: percentage > 20 ? 'high' : percentage > 10 ? 'medium' : 'low'
    };
  }

  static detectFraud(currentWeight, expectedWeight, tolerance = 0.05) {
    if (!expectedWeight || expectedWeight <= 0) return { isFraudulent: false };
    const difference = Math.abs(currentWeight - expectedWeight);
    const percentageDiff = (difference / expectedWeight) * 100;
    return {
      isFraudulent: percentageDiff > (tolerance * 100),
      difference: parseFloat(difference.toFixed(2)),
      percentageDiff: parseFloat(percentageDiff.toFixed(2)),
      expectedWeight,
      severity: percentageDiff > 15 ? 'high' : percentageDiff > 5 ? 'medium' : 'low'
    };
  }

  static predictRevenue(historicalData, periods = 7) {
    if (!historicalData || historicalData.length < 2) return { predictions: [], confidence: 0 };
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
    const sumY = historicalData.reduce((sum, d) => sum + d.revenue, 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + i * d.revenue, 0);
    const sumXX = historicalData.reduce((sum, _, i) => sum + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predictions = [];
    for (let i = 1; i <= periods; i++) {
      const predictedValue = slope * (n - 1 + i) + intercept;
      predictions.push({
        period: i,
        predictedRevenue: Math.max(0, parseFloat(predictedValue.toFixed(2))),
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000)
      });
    }
    const avgY = sumY / n;
    const ssTotal = historicalData.reduce((sum, d) => sum + Math.pow(d.revenue - avgY, 2), 0);
    const ssResidual = historicalData.reduce((sum, d, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(d.revenue - predicted, 2);
    }, 0);
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
    return { predictions, confidence: parseFloat((rSquared * 100).toFixed(2)), trend: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable' };
  }

  static calculateRiskScore(shipment, vehicle, weightLog) {
    let score = 0;
    const factors = [];
    if (vehicle.currentWeight > vehicle.capacity) {
      const overloadPct = ((vehicle.currentWeight - vehicle.capacity) / vehicle.capacity) * 100;
      score += Math.min(40, overloadPct * 2);
      factors.push({ type: 'overload', weight: Math.min(40, overloadPct * 2) });
    }
    const distance = Math.floor(Math.random() * 2000) + 100;
    if (distance > 1000) { score += 15; factors.push({ type: 'long_distance', weight: 15 }); }
    if (weightLog && Math.abs(weightLog.weight - shipment.weight) > shipment.weight * 0.1) {
      score += 25; factors.push({ type: 'weight_mismatch', weight: 25 });
    }
    if (vehicle.status === 'maintenance') { score += 20; factors.push({ type: 'vehicle_condition', weight: 20 }); }
    const daysUntilDelivery = Math.ceil((new Date(shipment.deliveryDate) - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDelivery < 2) { score += 10; factors.push({ type: 'urgent_delivery', weight: 10 }); }
    return { score: Math.min(100, Math.round(score)), level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low', factors };
  }

  static generateRecommendations(vehicle, shipment, weightLog) {
    const recommendations = [];
    if (vehicle.currentWeight > vehicle.capacity) {
      const overloadPct = ((vehicle.currentWeight - vehicle.capacity) / vehicle.capacity) * 100;
      recommendations.push({ type: 'overload', priority: 'high', message: `Vehicle overloaded by ${overloadPct.toFixed(1)}%. Recommend splitting shipment.`, action: 'split_shipment' });
    }
    if (vehicle.currentWeight < vehicle.capacity * 0.3) {
      recommendations.push({ type: 'underutilization', priority: 'medium', message: `Vehicle only ${((vehicle.currentWeight / vehicle.capacity) * 100).toFixed(1)}% loaded. Consider combining shipments.`, action: 'combine_shipments' });
    }
    if (shipment && shipment.status === 'pending' && new Date(shipment.shipmentDate) < new Date()) {
      recommendations.push({ type: 'delay', priority: 'high', message: 'Shipment is overdue. Expedite dispatch immediately.', action: 'expedite' });
    }
    return recommendations;
  }

  static analyzeWeightTrend(weightLogs, period = 'daily') {
    if (!weightLogs || weightLogs.length === 0) return { trend: 'insufficient_data', change: 0, average: 0 };
    const sorted = weightLogs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const avgFirst = firstHalf.reduce((sum, w) => sum + w.weight, 0) / firstHalf.length || 0;
    const avgSecond = secondHalf.reduce((sum, w) => sum + w.weight, 0) / secondHalf.length || 0;
    const change = avgSecond - avgFirst;
    const percentChange = avgFirst > 0 ? (change / avgFirst) * 100 : 0;
    return {
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      change: parseFloat(change.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2)),
      average: parseFloat(avgSecond.toFixed(2)),
      peak: Math.max(...sorted.map(w => w.weight)),
      lowest: Math.min(...sorted.map(w => w.weight))
    };
  }
}

module.exports = AIEngine;
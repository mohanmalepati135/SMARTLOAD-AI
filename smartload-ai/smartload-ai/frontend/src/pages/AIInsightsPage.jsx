import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Shield, Zap, BarChart3, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const InsightCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 card-shadow border border-border/50">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      {trend && <span className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-secondary-text'}`}>
        {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : trend === 'down' ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      </span>}
    </div>
    <h3 className="text-2xl font-bold text-primary-text mb-1">{value}</h3>
    <p className="text-sm font-medium text-secondary-text mb-1">{title}</p>
    {subtitle && <p className="text-xs text-secondary-text">{subtitle}</p>}
  </motion.div>
);

const AIInsightsPage = () => {
  const [insights, setInsights] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInsights(); }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const [insightsRes, riskRes, recRes] = await Promise.all([
        api.get('/ai/insights'), api.get('/ai/risk-analysis'), api.get('/ai/recommendations')
      ]);
      setInsights(insightsRes.data);
      setRiskData(riskRes.data);
      setRecommendations(recRes.data.recommendations || []);
    } catch (error) { toast.error('Failed to load AI insights'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="page-container"><div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded-lg w-48"></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}</div></div></div>;

  const revenuePrediction = insights?.revenuePrediction?.predictions || [];
  const utilizationData = insights?.utilization || [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-text">AI Insights</h1>
        <p className="text-secondary-text mt-1">Intelligent analytics and predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <InsightCard title="Weight Trend" value={insights?.weightTrend?.trend || 'N/A'} subtitle={`${insights?.weightTrend?.percentChange || 0}% change`} icon={TrendingUp} color="#4F46E5" trend={insights?.weightTrend?.trend === 'increasing' ? 'up' : 'down'} />
        <InsightCard title="Revenue Forecast" value={`$${revenuePrediction[0]?.predictedRevenue?.toLocaleString() || 0}`} subtitle={`Confidence: ${insights?.revenuePrediction?.confidence || 0}%`} icon={BarChart3} color="#10B981" trend="up" />
        <InsightCard title="Overload Incidents" value={insights?.overloadSummary?.count || 0} subtitle={`Avg: ${(insights?.overloadSummary?.averageOverload || 0).toFixed(1)}%`} icon={AlertTriangle} color="#EF4444" />
        <InsightCard title="Fleet Utilization" value={`${(utilizationData.reduce((sum, u) => sum + (u.utilization || 0), 0) / (utilizationData.length || 1)).toFixed(1)}%`} subtitle={`${utilizationData.length} vehicles tracked`} icon={Activity} color="#0EA5E9" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 card-shadow border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-text">Revenue Prediction (7 Days)</h3>
            <Brain className="w-5 h-5 text-primary-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenuePrediction}>
              <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="period" tickFormatter={(v) => `Day ${v}`} stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
              <Area type="monotone" dataKey="predictedRevenue" stroke="#10B981" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 card-shadow border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-text">Risk Analysis</h3>
            <Shield className="w-5 h-5 text-danger" />
          </div>
          {riskData?.risks?.length === 0 ? (
            <div className="text-center py-12 text-secondary-text"><Shield className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No active risks detected</p></div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
              {riskData?.risks?.slice(0, 5).map((risk, i) => (
                <div key={i} className={`p-4 rounded-xl border ${risk.level === 'high' ? 'bg-red-50 border-red-200' : risk.level === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-primary-text">{risk.shipmentId}</span>
                    <span className={`badge ${risk.level === 'high' ? 'badge-danger' : risk.level === 'medium' ? 'badge-warning' : 'badge-success'}`}>{risk.level.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-secondary-text mb-2">{risk.vehicleNumber}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${risk.level === 'high' ? 'bg-danger' : risk.level === 'medium' ? 'bg-warning' : 'bg-success'}`} style={{ width: `${risk.riskScore}%` }} /></div>
                  <p className="text-xs text-secondary-text mt-1">Risk Score: {risk.riskScore}/100</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-primary-text">Smart Recommendations</h3>
          <Zap className="w-5 h-5 text-warning" />
        </div>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-secondary-text"><Zap className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No recommendations at this time</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border ${rec.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rec.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {rec.priority === 'high' ? <AlertTriangle className="w-4 h-4 text-danger" /> : <Zap className="w-4 h-4 text-primary-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-text">{rec.message}</p>
                    <p className="text-xs text-secondary-text mt-1">{rec.vehicleNumber}</p>
                    <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{rec.action}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIInsightsPage;
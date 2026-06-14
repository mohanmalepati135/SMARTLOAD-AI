import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle, Clock, Shield, Check } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import toast from 'react-hot-toast';

const severityConfig = {
  high: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, bg: 'bg-red-50' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, bg: 'bg-yellow-50' },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Bell, bg: 'bg-blue-50' }
};

const typeConfig = {
  overload: { label: 'Overload', color: 'text-danger' },
  weight_mismatch: { label: 'Weight Mismatch', color: 'text-warning' },
  machine_disconnected: { label: 'Machine Disconnected', color: 'text-secondary-text' },
  shipment_delay: { label: 'Shipment Delay', color: 'text-warning' },
  high_risk: { label: 'High Risk', color: 'text-danger' },
  fraud_detected: { label: 'Fraud Detected', color: 'text-danger' }
};

const AlertsPage = () => {
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('false');
  const { alerts, stats, loading, resolveAlert } = useAlerts({ severity: severityFilter, isResolved: statusFilter });

  const handleResolve = async (id) => {
    try { await resolveAlert(id); toast.success('Alert resolved'); }
    catch (error) { toast.error('Failed to resolve alert'); }
  };

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Alert Center</h1>
          <p className="text-secondary-text mt-1">Monitor and manage system alerts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white card-shadow border border-border/50">
            <Bell className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-primary-text">{stats?.unreadCount || 0} Unresolved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Alerts', value: stats?.overall?.total || 0, icon: Bell, color: '#4F46E5' },
          { label: 'Unresolved', value: stats?.overall?.unresolved || 0, icon: AlertTriangle, color: '#F59E0B' },
          { label: 'High Severity', value: stats?.overall?.highSeverity || 0, icon: Shield, color: '#EF4444' },
          { label: 'Resolved Today', value: (stats?.overall?.total || 0) - (stats?.overall?.unresolved || 0), icon: CheckCircle, color: '#10B981' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 card-shadow border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-text">{stat.value}</p>
                <p className="text-xs text-secondary-text">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input-field md:w-48">
          <option value="">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field md:w-48">
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>)}</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-primary-text mb-2">No alerts found</h3>
          <p className="text-secondary-text">All systems operating normally</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const config = severityConfig[alert.severity] || severityConfig.low;
              const TypeIcon = config.icon;
              const typeInfo = typeConfig[alert.type] || { label: alert.type, color: 'text-secondary-text' };
              return (
                <motion.div key={alert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.03 }} className={`bg-white rounded-2xl p-5 card-shadow border border-border/50 ${alert.isResolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <TypeIcon className="w-6 h-6" style={{ color: alert.severity === 'high' ? '#EF4444' : alert.severity === 'medium' ? '#F59E0B' : '#2563EB' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-primary-text">{alert.title}</h3>
                          <span className={`badge ${config.color} text-xs`}>{alert.severity}</span>
                          <span className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                        </div>
                        <p className="text-sm text-secondary-text mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-secondary-text">
                          <span>{alert.vehicleNumber}</span>
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.isResolved ? (
                      <button onClick={() => handleResolve(alert._id)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors">
                        <Check className="w-4 h-4" /> Resolve
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-success"><CheckCircle className="w-4 h-4" /> Resolved</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
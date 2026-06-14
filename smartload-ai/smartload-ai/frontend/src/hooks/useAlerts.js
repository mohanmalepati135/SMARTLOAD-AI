import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAlerts = (params = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [alertsRes, statsRes] = await Promise.all([
        api.get('/alerts', { params }),
        api.get('/alerts/stats')
      ]);
      setAlerts(alertsRes.data.alerts);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const resolveAlert = async (id) => {
    await api.patch(`/alerts/${id}/resolve`);
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, isResolved: true } : a));
  };

  return { alerts, stats, loading, error, refetch: fetchAlerts, resolveAlert };
};
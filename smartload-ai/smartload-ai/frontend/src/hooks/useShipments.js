import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useShipments = (params = {}) => {
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/shipments', { params });
      setShipments(res.data.shipments);
      setPagination({
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        total: res.data.total
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const createShipment = async (data) => {
    const res = await api.post('/shipments', data);
    setShipments(prev => [res.data, ...prev]);
    return res.data;
  };

  const updateShipment = async (id, data) => {
    const res = await api.put(`/shipments/${id}`, data);
    setShipments(prev => prev.map(s => s._id === id ? res.data : s));
    return res.data;
  };

  const deleteShipment = async (id) => {
    await api.delete(`/shipments/${id}`);
    setShipments(prev => prev.filter(s => s._id !== id));
  };

  return { shipments, pagination, loading, error, refetch: fetchShipments, createShipment, updateShipment, deleteShipment };
};
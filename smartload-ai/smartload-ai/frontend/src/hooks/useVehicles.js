import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useVehicles = (params = {}) => {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data.vehicles);
      setPagination({
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        total: res.data.total
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const createVehicle = async (data) => {
    const res = await api.post('/vehicles', data);
    setVehicles(prev => [res.data, ...prev]);
    return res.data;
  };

  const updateVehicle = async (id, data) => {
    const res = await api.put(`/vehicles/${id}`, data);
    setVehicles(prev => prev.map(v => v._id === id ? res.data : v));
    return res.data;
  };

  const deleteVehicle = async (id) => {
    await api.delete(`/vehicles/${id}`);
    setVehicles(prev => prev.filter(v => v._id !== id));
  };

  return { vehicles, pagination, loading, error, refetch: fetchVehicles, createVehicle, updateVehicle, deleteVehicle };
};
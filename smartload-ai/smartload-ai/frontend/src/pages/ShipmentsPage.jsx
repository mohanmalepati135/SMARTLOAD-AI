import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, Filter, Truck, Calendar, MapPin, DollarSign, X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useShipments } from '../hooks/useShipments';
import { useVehicles } from '../hooks/useVehicles';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_transit: { color: 'bg-blue-100 text-blue-800', icon: Truck },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800', icon: X }
};

const AddShipmentModal = ({ isOpen, onClose, onSubmit, vehicles }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    data.vehicle = data.vehicle;
    data.shipmentDate = new Date(data.shipmentDate).toISOString();
    data.revenue = parseFloat(data.revenue) || 0;
    data.weight = parseFloat(data.weight) || 0;
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl p-8 w-full max-w-2xl card-shadow max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary-text">Create Shipment</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-secondary-text" />
            </button>
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Cargo Type</label>
                <input {...register('cargoType', { required: true })} className="input-field" placeholder="Electronics, Furniture, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Vehicle</label>
                <select {...register('vehicle', { required: true })} className="input-field">
                  <option value="">Select vehicle</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.vehicleNumber} - {v.driverName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Buyer</label>
                <input {...register('buyer', { required: true })} className="input-field" placeholder="Buyer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Seller</label>
                <input {...register('seller', { required: true })} className="input-field" placeholder="Seller name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Origin</label>
                <input {...register('origin', { required: true })} className="input-field" placeholder="City, State" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Destination</label>
                <input {...register('destination', { required: true })} className="input-field" placeholder="City, State" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Weight (kg)</label>
                <input {...register('weight')} type="number" className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Revenue ($)</label>
                <input {...register('revenue')} type="number" className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Shipment Date</label>
                <input {...register('shipmentDate', { required: true })} type="datetime-local" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Notes</label>
              <textarea {...register('notes')} rows={3} className="input-field" placeholder="Additional notes..." />
            </div>
            <button type="submit" className="w-full btn-primary py-3 mt-4">
              Create Shipment
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ShipmentsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { shipments, pagination, loading, createShipment, updateShipment } = useShipments({ page, limit: 10, search, status: statusFilter });
  const { vehicles } = useVehicles({ limit: 100 });

  const handleCreate = async (data) => {
    try {
      await createShipment(data);
      toast.success('Shipment created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateShipment(id, { status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Shipments</h1>
          <p className="text-secondary-text mt-1">Manage and track all shipments</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 px-6 py-3">
          <Plus className="w-5 h-5" /> Add Shipment
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input type="text" placeholder="Search shipments..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field md:w-48">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-primary-text mb-2">No shipments found</h3>
          <p className="text-secondary-text">Create your first shipment to get started</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Shipment ID</th>
                  <th className="table-header">Cargo</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Weight</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipments.map((shipment) => {
                  const status = statusConfig[shipment.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <motion.tr
                      key={shipment._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="table-cell font-mono text-xs">{shipment.shipmentId}</td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-primary-text">{shipment.cargoType}</p>
                          <p className="text-xs text-secondary-text">{shipment.buyer} → {shipment.seller}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-sm text-secondary-text">
                          <MapPin className="w-3 h-3" />
                          {shipment.origin} → {shipment.destination}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-secondary-text" />
                          <span className="text-sm">{shipment.vehicleNumber}</span>
                        </div>
                      </td>
                      <td className="table-cell font-medium">{shipment.weight} kg</td>
                      <td className="table-cell font-medium text-success">${shipment.revenue}</td>
                      <td className="table-cell">
                        <select
                          value={shipment.status}
                          onChange={(e) => handleStatusChange(shipment._id, e.target.value)}
                          className={`badge ${status.color} cursor-pointer border-0`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="table-cell">
                        {shipment.riskScore > 50 ? (
                          <span className="flex items-center gap-1 text-danger text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" /> {shipment.riskScore}
                          </span>
                        ) : (
                          <span className="text-sm text-secondary-text">{shipment.riskScore}</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-secondary-text">Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      <AddShipmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} vehicles={vehicles} />
    </div>
  );
};

export default ShipmentsPage;
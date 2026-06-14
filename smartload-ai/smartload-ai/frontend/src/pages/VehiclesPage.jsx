import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Search, Filter, Edit2, Trash2, Weight, Phone, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useVehicles } from '../hooks/useVehicles';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  on_trip: 'bg-blue-100 text-blue-800'
};

const vehicleTypeIcons = {
  truck: '🚛', van: '🚐', container: '📦', trailer: '🚚', pickup: '🛻'
};

const AddVehicleModal = ({ isOpen, onClose, onSubmit }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
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
          className="bg-white rounded-2xl p-8 w-full max-w-lg card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary-text">Add Vehicle</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-secondary-text" />
            </button>
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Vehicle Number</label>
                <input {...register('vehicleNumber', { required: true })} className="input-field" placeholder="ABC-1234" />
                {errors.vehicleNumber && <p className="text-danger text-sm mt-1">Required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Vehicle Type</label>
                <select {...register('vehicleType', { required: true })} className="input-field">
                  <option value="">Select type</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="container">Container</option>
                  <option value="trailer">Trailer</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Driver Name</label>
                <input {...register('driverName', { required: true })} className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Driver Phone</label>
                <input {...register('driverPhone', { required: true })} className="input-field" placeholder="+1 555-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Capacity (kg)</label>
                <input {...register('capacity', { required: true, min: 0 })} type="number" className="input-field" placeholder="5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">License Number</label>
                <input {...register('licenseNumber', { required: true })} className="input-field" placeholder="LIC-123456" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Status</label>
              <select {...register('status')} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button type="submit" className="w-full btn-primary py-3 mt-4">
              Add Vehicle
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const VehiclesPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { vehicles, pagination, loading, createVehicle, deleteVehicle } = useVehicles({ page, limit: 10, search, status: statusFilter });

  const handleCreate = async (data) => {
    try {
      await createVehicle(data);
      toast.success('Vehicle added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      toast.success('Vehicle deleted');
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Vehicle Management</h1>
          <p className="text-secondary-text mt-1">Manage your fleet and drivers</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5" /> Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field md:w-48"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="on_trip">On Trip</option>
        </select>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-primary-text mb-2">No vehicles found</h3>
          <p className="text-secondary-text">Add your first vehicle to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, i) => (
              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 card-shadow border border-border/50 hover:card-shadow-hover transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{vehicleTypeIcons[vehicle.vehicleType] || '🚛'}</div>
                    <div>
                      <h3 className="font-bold text-primary-text">{vehicle.vehicleNumber}</h3>
                      <span className={`badge ${statusColors[vehicle.status] || 'bg-gray-100'}`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-secondary-text hover:text-primary-text transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-secondary-text hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-secondary-text">
                    <User className="w-4 h-4" />
                    <span>{vehicle.driverName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-text">
                    <Phone className="w-4 h-4" />
                    <span>{vehicle.driverPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-text">
                    <Weight className="w-4 h-4" />
                    <span>Capacity: {vehicle.capacity.toLocaleString()} kg</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary-text">Current Load</span>
                    <span className="text-sm font-semibold text-primary-text">
                      {vehicle.currentWeight.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (vehicle.currentWeight / vehicle.capacity) * 100)}%`,
                        backgroundColor: vehicle.currentWeight > vehicle.capacity ? '#EF4444' : vehicle.currentWeight > vehicle.capacity * 0.8 ? '#F59E0B' : '#10B981'
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-secondary-text">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      <AddVehicleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
};

export default VehiclesPage;
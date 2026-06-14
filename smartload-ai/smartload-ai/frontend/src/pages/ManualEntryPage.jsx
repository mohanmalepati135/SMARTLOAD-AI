import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hand, Save, Weight, Truck, User, Package, MapPin, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ManualEntryPage = () => {
  const [formData, setFormData] = useState({ vehicleNumber: '', driverName: '', cargoType: '', weight: '', buyer: '', seller: '', location: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = { ...formData, weight: parseFloat(formData.weight) };
      const res = await api.post('/weights/manual', data);
      setRecentEntries(prev => [res.data, ...prev].slice(0, 5));
      setFormData({ vehicleNumber: '', driverName: '', cargoType: '', weight: '', buyer: '', seller: '', location: '', notes: '' });
      toast.success('Manual entry saved successfully');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save entry'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-text">Manual Weight Entry</h1>
        <p className="text-secondary-text mt-1">Record weight measurements manually</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 bg-white rounded-2xl p-8 card-shadow border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Hand className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-text">Weight Entry Form</h2>
              <p className="text-sm text-secondary-text">All fields marked with * are required</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Vehicle Number *</span></label>
                <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required className="input-field" placeholder="ABC-1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2"><span className="flex items-center gap-2"><User className="w-4 h-4" /> Driver Name</span></label>
                <input name="driverName" value={formData.driverName} onChange={handleChange} className="input-field" placeholder="John Doe" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2"><span className="flex items-center gap-2"><Package className="w-4 h-4" /> Cargo Type</span></label>
                <input name="cargoType" value={formData.cargoType} onChange={handleChange} className="input-field" placeholder="Electronics, Furniture, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2"><span className="flex items-center gap-2"><Weight className="w-4 h-4" /> Weight (kg) *</span></label>
                <input name="weight" type="number" step="0.01" min="0" value={formData.weight} onChange={handleChange} required className="input-field" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Buyer</label>
                <input name="buyer" value={formData.buyer} onChange={handleChange} className="input-field" placeholder="Buyer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Seller</label>
                <input name="seller" value={formData.seller} onChange={handleChange} className="input-field" placeholder="Seller name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2"><span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span></label>
              <input name="location" value={formData.location} onChange={handleChange} className="input-field" placeholder="Warehouse A, Dock 3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2"><span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</span></label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="input-field" placeholder="Additional notes about this entry..." />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 card-shadow border border-border/50 h-fit">
          <h3 className="text-lg font-bold text-primary-text mb-4">Recent Entries</h3>
          {recentEntries.length === 0 ? (
            <div className="text-center py-8 text-secondary-text"><Hand className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">No recent entries</p></div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry, i) => (
                <motion.div key={entry._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl bg-gray-50 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-primary-text">{entry.vehicleNumber}</span>
                    <span className="text-xs text-secondary-text">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-lg font-bold text-primary-text">{entry.weight} kg</p>
                  {entry.cargoType && <p className="text-xs text-secondary-text">{entry.cargoType}</p>}
                  <span className="inline-block mt-2 badge badge-info text-xs">Manual Entry</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ManualEntryPage;
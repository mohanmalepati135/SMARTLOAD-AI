import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Building2, Bell, Shield, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-text">Settings</h1>
        <p className="text-secondary-text mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 card-shadow border border-border/50 space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'gradient-primary text-white' : 'text-secondary-text hover:bg-gray-100'}`}>
                <tab.icon className="w-5 h-5" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 bg-white rounded-2xl p-8 card-shadow border border-border/50">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold text-primary-text mb-6">Profile Settings</h2>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-text">{user?.name}</h3>
                  <p className="text-secondary-text">{user?.email}</p>
                  <span className="badge badge-info mt-2">{user?.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-primary-text mb-2">Full Name</label><input defaultValue={user?.name} className="input-field" readOnly /></div>
                <div><label className="block text-sm font-medium text-primary-text mb-2">Email</label><input defaultValue={user?.email} className="input-field" readOnly /></div>
                <div><label className="block text-sm font-medium text-primary-text mb-2">Phone</label><input defaultValue={user?.phoneNumber} className="input-field" readOnly /></div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div>
              <h2 className="text-xl font-bold text-primary-text mb-6">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-primary-text mb-2">Company Name</label><input defaultValue={user?.companyName} className="input-field" readOnly /></div>
                <div><label className="block text-sm font-medium text-primary-text mb-2">Account Type</label><input defaultValue={user?.role === 'admin' ? 'Administrator' : 'Standard User'} className="input-field" readOnly /></div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-bold text-primary-text mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Overload Alerts', desc: 'Get notified when a vehicle is overloaded' },
                  { label: 'Shipment Updates', desc: 'Receive updates on shipment status changes' },
                  { label: 'Machine Disconnection', desc: 'Alert when weighing machine disconnects' },
                  { label: 'Daily Summary', desc: 'Daily report of all activities' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                    <div><p className="font-medium text-primary-text">{item.label}</p><p className="text-sm text-secondary-text">{item.desc}</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-primary-text mb-6">Security Settings</h2>
              <div className="space-y-5">
                <div><label className="block text-sm font-medium text-primary-text mb-2">Current Password</label><input type="password" className="input-field" placeholder="••••••••" /></div>
                <div><label className="block text-sm font-medium text-primary-text mb-2">New Password</label><input type="password" className="input-field" placeholder="••••••••" /></div>
                <div><label className="block text-sm font-medium text-primary-text mb-2">Confirm New Password</label><input type="password" className="input-field" placeholder="••••••••" /></div>
                <button className="btn-primary px-6 py-2.5" onClick={() => toast.success('Password updated')}><Save className="w-4 h-4 inline mr-2" /> Update Password</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
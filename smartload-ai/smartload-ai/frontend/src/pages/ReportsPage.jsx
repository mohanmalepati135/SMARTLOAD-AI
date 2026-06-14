import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Truck, Package, Weight, FileSpreadsheet, FileIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const reportTypes = [
  { id: 'shipments', label: 'Shipment Reports', icon: Package, description: 'Complete shipment history with revenue and status', color: '#4F46E5' },
  { id: 'vehicles', label: 'Vehicle Reports', icon: Truck, description: 'Fleet overview with utilization and performance', color: '#10B981' },
  { id: 'weight-logs', label: 'Weight Log Reports', icon: Weight, description: 'All weight entries with overload analysis', color: '#0EA5E9' }
];

const ReportsPage = () => {
  const [generating, setGenerating] = useState(null);

  const generateReport = async (type, format) => {
    try {
      setGenerating(`${type}-${format}`);
      const response = await api.get(`/reports/${type}`, {
        params: { format },
        responseType: format === 'json' ? 'json' : 'blob'
      });
      if (format === 'json') { toast.success('Report generated'); return; }
      const blob = new Blob([response.data], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded`);
    } catch (error) { toast.error('Failed to generate report'); }
    finally { setGenerating(null); }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-text">Reports</h1>
        <p className="text-secondary-text mt-1">Generate and export analytics reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((report, i) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 card-shadow border border-border/50">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: `${report.color}15` }}>
              <report.icon className="w-7 h-7" style={{ color: report.color }} />
            </div>
            <h3 className="text-xl font-bold text-primary-text mb-2">{report.label}</h3>
            <p className="text-sm text-secondary-text mb-6">{report.description}</p>
            <div className="space-y-3">
              <button onClick={() => generateReport(report.id, 'csv')} disabled={generating === `${report.id}-csv`} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50">
                <FileSpreadsheet className="w-4 h-4" />
                {generating === `${report.id}-csv` ? 'Generating...' : 'Download CSV'}
              </button>
              <button onClick={() => generateReport(report.id, 'pdf')} disabled={generating === `${report.id}-pdf`} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50">
                <FileIcon className="w-4 h-4" />
                {generating === `${report.id}-pdf` ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-white rounded-2xl p-6 card-shadow border border-border/50">
        <h3 className="text-lg font-bold text-primary-text mb-4">Report Schedule</h3>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-border/50">
          <Calendar className="w-8 h-8 text-primary-500" />
          <div>
            <p className="font-medium text-primary-text">Daily Reports</p>
            <p className="text-sm text-secondary-text">Automated daily summary reports available at 00:00 UTC</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsPage;
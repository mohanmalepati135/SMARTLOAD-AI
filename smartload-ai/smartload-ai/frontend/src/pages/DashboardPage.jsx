import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, DollarSign, Weight, TrendingUp, AlertTriangle, Clock, Activity } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const COLORS = ['#4F46E5', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];

const KPICard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="kpi-card"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-3xl font-extrabold text-primary-text mb-1">{value}</h3>
    <p className="text-sm text-secondary-text font-medium">{title}</p>
    {subtitle && <p className="text-xs text-secondary-text mt-1">{subtitle}</p>}
  </motion.div>
);

const ActivityItem = ({ type, message, time, icon: Icon }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-primary-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-primary-text font-medium truncate">{message}</p>
      <p className="text-xs text-secondary-text">{time}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="page-container text-danger">{error}</div>;

  const { kpi, analytics, recentActivity } = data || {};

  const shipmentChartData = analytics?.dailyShipments?.map(d => ({
    date: d._id,
    shipments: d.count,
    revenue: d.revenue
  })) || [];

  const weightChartData = analytics?.dailyWeights?.map(d => ({
    date: d._id,
    weight: d.totalWeight,
    avgWeight: Math.round(d.avgWeight || 0)
  })) || [];

  const vehicleStatusData = analytics?.vehicleStatusDist?.map(d => ({
    name: d._id,
    value: d.count
  })) || [];

  const shipmentStatusData = analytics?.shipmentStatusDist?.map(d => ({
    name: d._id,
    value: d.count
  })) || [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Dashboard</h1>
          <p className="text-secondary-text mt-1">Overview of your logistics operations</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Vehicles"
          value={kpi?.totalVehicles || 0}
          icon={Truck}
          color="#4F46E5"
          trend={12}
        />
        <KPICard
          title="Pending Shipments"
          value={kpi?.pendingShipments || 0}
          icon={Package}
          color="#F59E0B"
          trend={-5}
        />
        <KPICard
          title="Total Revenue"
          value={`$${(kpi?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="#10B981"
          trend={23}
        />
        <KPICard
          title="Total Cargo Weight"
          value={`${(kpi?.totalCargoWeight || 0).toLocaleString()} kg`}
          icon={Weight}
          color="#0EA5E9"
          trend={8}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Shipment Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 card-shadow border border-border/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-text">Shipment Analytics</h3>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={shipmentChartData}>
              <defs>
                <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="shipments" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorShipments)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weight Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 card-shadow border border-border/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-text">Weight Trends</h3>
            <Weight className="w-5 h-5 text-ai" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: '#0EA5E9', r: 4 }} />
              <Line type="monotone" dataKey="avgWeight" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#2563EB', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 card-shadow border border-border/50"
        >
          <h3 className="text-lg font-bold text-primary-text mb-6">Vehicle Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={vehicleStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {vehicleStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Shipment Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 card-shadow border border-border/50"
        >
          <h3 className="text-lg font-bold text-primary-text mb-6">Shipment Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={shipmentStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#6B7280" width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}
              />
              <Bar dataKey="value" fill="#4F46E5" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 card-shadow border border-border/50"
        >
          <h3 className="text-lg font-bold text-primary-text mb-4">Recent Activity</h3>
          <div className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-hide">
            {recentActivity?.weightLogs?.length === 0 && recentActivity?.shipments?.length === 0 && (
              <div className="text-center py-8 text-secondary-text">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
            {recentActivity?.weightLogs?.slice(0, 3).map((log, i) => (
              <ActivityItem
                key={`weight-${i}`}
                type="weight"
                message={`Weight recorded: ${log.weight}kg for ${log.vehicle?.vehicleNumber || 'Unknown'}`}
                time={new Date(log.createdAt).toLocaleString()}
                icon={Weight}
              />
            ))}
            {recentActivity?.shipments?.slice(0, 3).map((shipment, i) => (
              <ActivityItem
                key={`shipment-${i}`}
                type="shipment"
                message={`New shipment ${shipment.shipmentId} created`}
                time={new Date(shipment.createdAt).toLocaleString()}
                icon={Package}
              />
            ))}
            {recentActivity?.alerts?.slice(0, 2).map((alert, i) => (
              <ActivityItem
                key={`alert-${i}`}
                type="alert"
                message={alert.title}
                time={new Date(alert.createdAt).toLocaleString()}
                icon={AlertTriangle}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
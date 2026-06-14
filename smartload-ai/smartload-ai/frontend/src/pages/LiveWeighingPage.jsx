import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Play, Pause, Square, Wifi, WifiOff, Cpu, Hand, Activity, AlertTriangle, CheckCircle, TrendingUp, Download, RotateCcw } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useVehicles } from '../hooks/useVehicles';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MODES = {
  SIMULATION: 'simulation',
  MACHINE: 'machine',
  MANUAL: 'manual'
};

const WeightDisplay = ({ weight, isActive, mode }) => {
  const [displayWeight, setDisplayWeight] = useState(weight);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (weight !== displayWeight) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setDisplayWeight(weight);
      return () => clearTimeout(timer);
    }
  }, [weight]);

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center rounded-3xl p-12 ${
        mode === MODES.SIMULATION ? 'bg-gradient-to-br from-primary-500/10 to-ai/10 border-2 border-primary-200' :
        mode === MODES.MACHINE ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-200' :
        'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-2 border-orange-200'
      }`}
      animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {isActive && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span className="text-xs font-medium text-success">Live</span>
        </div>
      )}

      <div className="text-7xl md:text-9xl font-extrabold tracking-tight text-primary-text tabular-nums">
        {displayWeight.toLocaleString()}
      </div>
      <div className="text-2xl font-semibold text-secondary-text mt-2">KILOGRAMS</div>

      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur">
        {mode === MODES.SIMULATION && <><Cpu className="w-4 h-4 text-primary-500" /><span className="text-sm font-medium text-primary-600">Simulation Mode Active</span></>}
        {mode === MODES.MACHINE && <><Wifi className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-600">Machine Connected</span></>}
        {mode === MODES.MANUAL && <><Hand className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-orange-600">Manual Entry</span></>}
      </div>
    </motion.div>
  );
};

const LiveWeighingPage = () => {
  const [mode, setMode] = useState(MODES.SIMULATION);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [weight, setWeight] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [weightHistory, setWeightHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [overload, setOverload] = useState(null);
  const simulationRef = useRef(null);
  const { socket } = useSocket();
  const { vehicles } = useVehicles({ limit: 100 });

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('simulation_weight', (data) => {
      setWeight(data.weight);
      setWeightHistory(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString(), weight: data.weight }]);
    });

    socket.on('machine_weight_update', (data) => {
      setWeight(data.weight);
      setWeightHistory(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString(), weight: data.weight }]);
    });

    socket.on('weight_update', (data) => {
      if (data.overload) {
        setOverload(data.overload);
        if (data.overload.isOverload) {
          toast.error(`Overload detected: ${data.overload.percentage}% over capacity!`);
        }
      }
    });

    return () => {
      socket.off('simulation_weight');
      socket.off('machine_weight_update');
      socket.off('weight_update');
    };
  }, [socket]);

  // Simulation mode
  const startSimulation = useCallback(async () => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle first');
      return;
    }
    setIsRunning(true);
    setOverload(null);

    // Start socket simulation
    socket?.emit('start_simulation', { vehicleId: selectedVehicle, userId: JSON.parse(localStorage.getItem('user'))?.id });

    // Also save to backend
    simulationRef.current = setInterval(async () => {
      try {
        const res = await api.post('/weights/simulation', { vehicleId: selectedVehicle });
        setLogs(prev => [res.data.weightLog, ...prev].slice(0, 50));
        if (res.data.overload?.isOverload) {
          setOverload(res.data.overload);
        }
      } catch (error) {
        console.error('Simulation error:', error);
      }
    }, 2500);
  }, [selectedVehicle, socket]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    socket?.emit('stop_simulation');
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
  }, [socket]);

  const handleManualEntry = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.weight = parseFloat(data.weight);

    try {
      const res = await api.post('/weights/manual', data);
      setWeight(data.weight);
      setLogs(prev => [res.data, ...prev].slice(0, 50));
      setWeightHistory(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString(), weight: data.weight }]);
      toast.success('Manual entry saved');
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save entry');
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Time', 'Vehicle', 'Weight (kg)', 'Type', 'Overload'].join(','),
      ...logs.map(l => [
        new Date(l.createdAt).toLocaleString(),
        l.vehicleNumber,
        l.weight,
        l.entryType,
        l.isOverload ? `Yes (${l.overloadPercentage}%)` : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weight-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Live Weighing</h1>
          <p className="text-secondary-text mt-1">Real-time cargo weight monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportLogs} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-gray-50 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id: MODES.SIMULATION, label: 'Simulation', icon: Cpu },
          { id: MODES.MACHINE, label: 'Machine', icon: Wifi },
          { id: MODES.MANUAL, label: 'Manual', icon: Hand }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); stopSimulation(); setWeight(0); setOverload(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === m.id
                ? 'bg-white text-primary-text shadow-sm'
                : 'text-secondary-text hover:text-primary-text'
            }`}
          >
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      {/* Vehicle Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-primary-text mb-2">Select Vehicle</label>
        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="input-field md:w-96"
        >
          <option value="">Choose a vehicle...</option>
          {vehicles.map(v => (
            <option key={v._id} value={v._id}>
              {v.vehicleNumber} - {v.driverName} (Capacity: {v.capacity}kg)
            </option>
          ))}
        </select>
      </div>

      {/* Weight Display */}
      <div className="mb-8">
        <WeightDisplay weight={weight} isActive={isRunning} mode={mode} />
      </div>

      {/* Overload Alert */}
      <AnimatePresence>
        {overload?.isOverload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0" />
            <div>
              <p className="font-semibold text-danger">Overload Detected!</p>
              <p className="text-sm text-red-700">
                Vehicle is overloaded by {overload.percentage}%. Recommend splitting shipment.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Controls */}
      {mode === MODES.SIMULATION && (
        <div className="flex items-center gap-4 mb-8">
          {!isRunning ? (
            <button
              onClick={startSimulation}
              disabled={!selectedVehicle}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Play className="w-5 h-5" /> Start Simulation
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-danger text-white font-semibold hover:bg-red-600 transition-all"
            >
              <Square className="w-5 h-5" /> Stop Simulation
            </button>
          )}
          <button
            onClick={() => { setWeight(0); setWeightHistory([]); setOverload(null); }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      )}

      {/* Machine Mode Info */}
      {mode === MODES.MACHINE && (
        <div className="mb-8 p-6 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Machine Integration Ready</h3>
              <p className="text-sm text-blue-700 mb-3">
                Connect your weighing machine via USB, Bluetooth, Serial Port, ESP32, or Arduino.
                The system will automatically detect and read weight data.
              </p>
              <div className="flex flex-wrap gap-2">
                {['USB', 'Bluetooth', 'Serial', 'ESP32', 'Arduino', 'API'].map(device => (
                  <span key={device} className="px-3 py-1 rounded-full bg-white text-xs font-medium text-blue-700 border border-blue-200">
                    {device}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {mode === MODES.MANUAL && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleManualEntry}
          className="mb-8 bg-white rounded-2xl p-6 card-shadow border border-border/50"
        >
          <h3 className="text-lg font-bold text-primary-text mb-4">Manual Weight Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Vehicle Number</label>
              <input name="vehicleNumber" required className="input-field" placeholder="ABC-1234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Driver Name</label>
              <input name="driverName" className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Cargo Type</label>
              <input name="cargoType" className="input-field" placeholder="Electronics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Weight (kg) *</label>
              <input name="weight" type="number" required min="0" step="0.01" className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Buyer</label>
              <input name="buyer" className="input-field" placeholder="Buyer name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">Location</label>
              <input name="location" className="input-field" placeholder="Warehouse A" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-primary-text mb-2">Notes</label>
            <textarea name="notes" rows={2} className="input-field" placeholder="Additional notes..." />
          </div>
          <button type="submit" className="mt-4 btn-primary px-8 py-3">
            Save Entry
          </button>
        </motion.form>
      )}

      {/* Weight Chart */}
      {weightHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 card-shadow border border-border/50 mb-8"
        >
          <h3 className="text-lg font-bold text-primary-text mb-4">Weight History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weightHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
              <Line type="monotone" dataKey="weight" stroke="#4F46E5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-primary-text">Recent Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="table-header">Time</th>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Weight</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.slice(0, 10).map((log, i) => (
                  <motion.tr
                    key={log._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="table-cell text-xs">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="table-cell font-medium">{log.vehicleNumber}</td>
                    <td className="table-cell font-bold">{log.weight} kg</td>
                    <td className="table-cell">
                      <span className={`badge ${
                        log.entryType === 'simulation' ? 'bg-purple-100 text-purple-700' :
                        log.entryType === 'machine' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {log.entryType}
                      </span>
                    </td>
                    <td className="table-cell">
                      {log.isOverload ? (
                        <span className="flex items-center gap-1 text-danger text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" /> Overload
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-success text-sm">
                          <CheckCircle className="w-4 h-4" /> Normal
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveWeighingPage;
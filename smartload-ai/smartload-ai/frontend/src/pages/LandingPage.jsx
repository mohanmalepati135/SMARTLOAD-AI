import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Truck, Brain, Shield, Zap, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Scale, title: 'Live Weighing', desc: 'Real-time cargo weight monitoring with simulation, machine integration, and manual entry modes.' },
  { icon: Brain, title: 'AI Intelligence', desc: 'Overload detection, fraud analysis, revenue prediction, and smart recommendations powered by AI.' },
  { icon: Truck, title: 'Fleet Management', desc: 'Complete vehicle tracking, driver management, and shipment assignment with real-time updates.' },
  { icon: Shield, title: 'Risk Management', desc: 'Automated risk scoring, alert generation, and compliance monitoring for every shipment.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Comprehensive dashboards with weight trends, revenue analytics, and performance insights.' },
  { icon: Zap, title: 'Real-time Sync', desc: 'Socket.io powered live updates across all devices with instant notifications.' },
];

const stats = [
  { value: '50K+', label: 'Shipments Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '30%', label: 'Efficiency Gain' },
  { value: '24/7', label: 'AI Monitoring' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SmartLoad AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-secondary-text hover:text-primary-text transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              AI-Powered Logistics Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary-text leading-tight mb-6">
              Intelligent Cargo<br />
              <span className="gradient-text">Weighing & Logistics</span>
            </h1>
            <p className="text-xl text-secondary-text mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your logistics operations with AI-driven cargo weighing, real-time fleet tracking,
              and intelligent shipment management. Built for scale, designed for efficiency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary px-8 py-4 text-lg flex items-center gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="px-8 py-4 rounded-xl border border-border text-primary-text font-semibold hover:bg-gray-50 transition-all">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-extrabold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-secondary-text">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-text mb-4">Everything You Need</h2>
            <p className="text-lg text-secondary-text max-w-2xl mx-auto">
              A complete logistics management platform with intelligent features designed for modern supply chains.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 card-shadow border border-border/50 hover:card-shadow-hover transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary-text mb-3">{feature.title}</h3>
                <p className="text-secondary-text leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-primary rounded-3xl p-12 md:p-16 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Logistics?</h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of logistics professionals using SmartLoad AI to optimize their operations.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">SmartLoad AI</span>
          </div>
          <p className="text-sm text-secondary-text">
            AI-Powered Intelligent Cargo Weighing & Logistics Management Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
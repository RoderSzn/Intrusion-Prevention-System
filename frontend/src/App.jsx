import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Shield, Activity, AlertTriangle, Settings, Terminal, BarChart3 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ThreatMonitor from './components/ThreatMonitor';
import RulesManager from './components/RulesManager';
import LiveLogs from './components/LiveLogs';
import Statistics from './components/Statistics';
import { getStatistics, getRules, getThreats, checkHealth } from './services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [threats, setThreats] = useState([]);
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState({
    total_requests: 0,
    blocked_requests: 0,
    allowed_requests: 0
  });
  const [logs, setLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState('checking');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to IPS server');
      setConnectionStatus('connected');
      addLog('✅ Connected to IPS server', 'success');
    });

    newSocket.on('welcome', (data) => {
      console.log('Welcome message:', data);
    });

    newSocket.on('threat-detected', (threat) => {
      console.log('Threat detected:', threat);
      setThreats(prev => [threat, ...prev].slice(0, 100));
      addLog(`🚫 BLOCKED: ${threat.threat_type} from ${threat.source_ip}`, 'danger');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Security Threat Detected!', {
          body: `${threat.threat_type} blocked from ${threat.source_ip}`,
          icon: '/vite.svg'
        });
      }
      
      loadStatistics();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnectionStatus('disconnected');
      addLog('⚠️ Disconnected from IPS server', 'warning');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      addLog('❌ Connection error', 'danger');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    loadData();
    checkSystemHealth();
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      loadStatistics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadThreats(),
      loadRules(),
      loadStatistics()
    ]);
  };

  const checkSystemHealth = async () => {
    try {
      const health = await checkHealth();
      setSystemStatus(health.status === 'healthy' ? 'active' : 'inactive');
      addLog(`System health check: ${health.status}`, 'info');
    } catch (error) {
      setSystemStatus('error');
      addLog('Failed to check system health', 'danger');
    }
  };

  const loadThreats = async () => {
    try {
      const data = await getThreats(100, 0);
      setThreats(data.threats || []);
      addLog(`Loaded ${data.threats?.length || 0} threats`, 'info');
    } catch (error) {
      console.error('Failed to load threats:', error);
      addLog('Failed to load threats', 'danger');
    }
  };

  const loadRules = async () => {
    try {
      const data = await getRules();
      setRules(data.rules || []);
      addLog(`Loaded ${data.rules?.length || 0} detection rules`, 'info');
    } catch (error) {
      console.error('Failed to load rules:', error);
      addLog('Failed to load rules', 'danger');
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await getStatistics();
      setStats(data.statistics || {
        total_requests: 0,
        blocked_requests: 0,
        allowed_requests: 0
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [log, ...prev].slice(0, 200));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} threats={threats} rules={rules} />;
      case 'threats':
        return <ThreatMonitor threats={threats} onRefresh={loadThreats} onLog={addLog} />;
      case 'rules':
        return <RulesManager rules={rules} onRefresh={loadRules} onLog={addLog} />;
      case 'logs':
        return <LiveLogs logs={logs} />;
      case 'statistics':
        return <Statistics stats={stats} threats={threats} />;
      default:
        return <Dashboard stats={stats} threats={threats} rules={rules} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="bg-slate-900/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="w-10 h-10 text-cyan-400" />
                {connectionStatus === 'connected' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Intrusion Prevention System
                </h1>
                <p className="text-gray-400 text-sm">Real-time Security Monitoring & Protection</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                connectionStatus === 'connected' ? 'bg-green-900/30 text-green-400 border border-green-500/50' :
                connectionStatus === 'error' ? 'bg-red-900/30 text-red-400 border border-red-500/50' :
                'bg-yellow-900/30 text-yellow-400 border border-yellow-500/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'error' ? 'bg-red-500' :
                  'bg-yellow-500'
                } ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
                {connectionStatus === 'connected' ? 'CONNECTED' : 
                 connectionStatus === 'error' ? 'ERROR' : 'CONNECTING...'}
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                systemStatus === 'active' ? 'bg-green-600 text-white' :
                systemStatus === 'error' ? 'bg-red-600 text-white' :
                'bg-yellow-600 text-white'
              }`}>
                {systemStatus === 'active' ? '🟢 ACTIVE' : 
                 systemStatus === 'error' ? '🔴 ERROR' : '🟡 CHECKING...'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto">
            <NavButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<Activity className="w-4 h-4" />}
              label="Dashboard"
            />
            <NavButton
              active={activeTab === 'threats'}
              onClick={() => setActiveTab('threats')}
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Threats"
              badge={threats.length}
            />
            <NavButton
              active={activeTab === 'rules'}
              onClick={() => setActiveTab('rules')}
              icon={<Settings className="w-4 h-4" />}
              label="Rules"
              badge={rules.filter(r => r.enabled).length}
            />
            <NavButton
              active={activeTab === 'logs'}
              onClick={() => setActiveTab('logs')}
              icon={<Terminal className="w-4 h-4" />}
              label="Logs"
            />
            <NavButton
              active={activeTab === 'statistics'}
              onClick={() => setActiveTab('statistics')}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analytics"
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {renderContent()}
      </main>

      <footer className="bg-slate-900/50 border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              <p>© 2024 Intrusion Prevention System. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-4">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Node.js Backend</span>
              <span>•</span>
              <span>React Frontend</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all relative whitespace-nowrap ${
      active 
        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50' 
        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {badge > 0 && (
      <span className={`absolute -top-2 -right-2 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold ${
        active ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
      } shadow-lg`}>
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

export default App;
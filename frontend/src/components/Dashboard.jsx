import React from 'react';
import { Activity, Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Zap, Settings } from 'lucide-react';
import { testSQLInjection, testXSS, testPathTraversal, testCommandInjection } from '../services/api';

const Dashboard = ({ stats, threats, rules }) => {
  const recentThreats = threats.slice(0, 5);
  const activeRules = rules.filter(r => r.enabled).length;
  const blockedToday = stats.blocked_requests || 0;
  
  const threatLevel = blockedToday > 50 ? 'critical' : 
                      blockedToday > 20 ? 'high' : 
                      blockedToday > 10 ? 'medium' : 'low';

  const getThreatLevelColor = (level) => {
    switch(level) {
      case 'critical': return 'text-red-500 bg-red-500/20 border-red-500';
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500';
      case 'low': return 'text-green-500 bg-green-500/20 border-green-500';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
      critical: 'bg-purple-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const handleTestAttack = async (testFn, name) => {
    try {
      const result = await testFn();
      console.log(`${name} test result:`, result);
    } catch (error) {
      console.error(`${name} test error:`, error);
    }
  };

  const blockRate = stats.total_requests > 0 
    ? ((stats.blocked_requests / stats.total_requests) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats.total_requests || 0}
          icon={<Activity className="w-8 h-8 text-blue-400" />}
          trend={<TrendingUp className="w-4 h-4 text-green-400" />}
          trendText="+12%"
          color="blue"
        />
        <StatCard
          title="Blocked Attacks"
          value={stats.blocked_requests || 0}
          icon={<Shield className="w-8 h-8 text-red-400" />}
          trend={<TrendingDown className="w-4 h-4 text-green-400" />}
          trendText="-8%"
          color="red"
        />
        <StatCard
          title="Allowed Requests"
          value={stats.allowed_requests || 0}
          icon={<CheckCircle className="w-8 h-8 text-green-400" />}
          trend={<TrendingUp className="w-4 h-4 text-green-400" />}
          trendText="+15%"
          color="green"
        />
        <StatCard
          title="Threat Level"
          value={threatLevel.toUpperCase()}
          icon={<AlertTriangle className={`w-8 h-8 ${getThreatLevelColor(threatLevel).split(' ')[0]}`} />}
          color={threatLevel}
          isText
          badge={`${blockRate}% blocked`}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Rules</p>
              <p className="text-2xl font-bold text-cyan-400">{activeRules} / {rules.length}</p>
            </div>
            <Settings className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${rules.length > 0 ? (activeRules / rules.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Block Rate</p>
              <p className="text-2xl font-bold text-orange-400">{blockRate}%</p>
            </div>
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.blocked_requests} of {stats.total_requests} requests blocked
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recent Threats</p>
              <p className="text-2xl font-bold text-purple-400">{threats.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Last 100 detected threats
          </p>
        </div>
      </div>

      {/* Test Attack Buttons */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Test Attack Scenarios
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Simulate various attack types to test the IPS detection capabilities
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleTestAttack(testSQLInjection, 'SQL Injection')}
            className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            SQL Injection
          </button>
          <button
            onClick={() => handleTestAttack(testXSS, 'XSS')}
            className="px-4 py-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            XSS Attack
          </button>
          <button
            onClick={() => handleTestAttack(testPathTraversal, 'Path Traversal')}
            className="px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Path Traversal
          </button>
          <button
            onClick={() => handleTestAttack(testCommandInjection, 'Command Injection')}
            className="px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Cmd Injection
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Click any button to simulate an attack. The IPS will detect and block it in real-time.
        </p>
      </div>

      {/* Recent Threats */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Recent Threats
        </h2>
        {recentThreats.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-400" />
            <p className="text-gray-400 text-lg font-medium">All Clear!</p>
            <p className="text-gray-500 text-sm">No threats detected recently</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentThreats.map(threat => (
              <div key={threat.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(threat.severity)}`}>
                        {threat.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(threat.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-red-900/50 text-red-200 rounded border border-red-700">
                        BLOCKED
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{threat.threat_type}</h3>
                    <div className="text-sm space-y-1 text-gray-400">
                      <p>
                        <span className="text-gray-500">Source:</span>{' '}
                        <span className="font-mono text-cyan-400">{threat.source_ip}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Request:</span>{' '}
                        <span className="font-mono">{threat.request_method} {threat.request_path}</span>
                      </p>
                    </div>
                  </div>
                  <Shield className="w-6 h-6 text-red-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isText, trend, trendText, badge }) => (
  <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${isText ? `text-${color}-400` : ''}`}>
          {value}
        </p>
        {badge && (
          <span className="inline-block mt-2 text-xs px-2 py-1 bg-slate-700 rounded text-gray-300">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3 bg-slate-900 rounded-lg">
        {icon}
      </div>
    </div>
    {trend && trendText && (
      <div className="flex items-center gap-1 text-sm">
        {trend}
        <span className="text-gray-400">{trendText} from last week</span>
      </div>
    )}
  </div>
);

export default Dashboard;
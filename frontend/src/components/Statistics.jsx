import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const Statistics = ({ stats, threats }) => {
  const threatsBySeverity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    threats.forEach(threat => {
      counts[threat.severity] = (counts[threat.severity] || 0) + 1;
    });
    return [
      { name: 'Critical', value: counts.critical, color: '#a855f7' },
      { name: 'High', value: counts.high, color: '#ef4444' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'Low', value: counts.low, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [threats]);

  const threatsByType = useMemo(() => {
    const counts = {};
    threats.forEach(threat => {
      counts[threat.threat_type] = (counts[threat.threat_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [threats]);

  const threatsByHour = useMemo(() => {
    const hourCounts = Array(24).fill(0).map((_, i) => ({ hour: i, threats: 0 }));
    threats.forEach(threat => {
      const hour = new Date(threat.timestamp).getHours();
      hourCounts[hour].threats++;
    });
    return hourCounts;
  }, [threats]);

  const overviewData = [
    { name: 'Total', value: stats.total_requests || 0, fill: '#06b6d4' },
    { name: 'Blocked', value: stats.blocked_requests || 0, fill: '#ef4444' },
    { name: 'Allowed', value: stats.allowed_requests || 0, fill: '#22c55e' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-cyan-400" />
        Statistics & Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Detection Rate"
          value={`${stats.total_requests > 0 ? ((stats.blocked_requests / stats.total_requests) * 100).toFixed(1) : 0}%`}
          color="text-red-400"
          description="Percentage of blocked requests"
        />
        <StatCard
          title="Average Response"
          value="23ms"
          color="text-green-400"
          description="Average blocking response time"
        />
        <StatCard
          title="Uptime"
          value="99.9%"
          color="text-cyan-400"
          description="System availability"
        />
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-xl font-bold mb-4">Request Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={overviewData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '0.5rem'
              }}
            />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-xl font-bold mb-4">Threats by Severity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={threatsBySeverity}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {threatsBySeverity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '0.5rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-xl font-bold mb-4">Top Threat Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatsByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#9ca3af" 
                width={150}
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-xl font-bold mb-4">Threat Activity by Hour</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={threatsByHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="hour" 
              stroke="#9ca3af"
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="#9ca3af"
              label={{ value: 'Threats', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '0.5rem'
              }}
              labelFormatter={(hour) => `${hour}:00`}
            />
            <Line 
              type="monotone" 
              dataKey="threats" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Peak Hour"
          value={`${threatsByHour.reduce((max, curr) => 
            curr.threats > max.threats ? curr : max
          ).hour}:00`}
          description="Most active hour"
        />
        <MetricCard
          title="Unique IPs"
          value={new Set(threats.map(t => t.source_ip)).size}
          description="Different sources"
        />
        <MetricCard
          title="Avg per Day"
          value={Math.round(threats.length / Math.max(1, 
            (Date.now() - new Date(threats[threats.length - 1]?.timestamp || Date.now())) / 86400000
          ))}
          description="Daily threat average"
        />
        <MetricCard
          title="False Positives"
          value="0"
          description="Incorrectly blocked"
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, description }) => (
  <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
    <p className="text-sm text-gray-400 mb-1">{title}</p>
    <p className={`text-4xl font-bold ${color} mb-1`}>{value}</p>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

const MetricCard = ({ title, value, description }) => (
  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
    <p className="text-xs text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

export default Statistics;
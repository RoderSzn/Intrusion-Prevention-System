import React, { useState } from 'react';
import { AlertTriangle, XCircle, Eye, Trash2, Filter, Search, Download } from 'lucide-react';
import { clearThreats } from '../services/api';

const ThreatMonitor = ({ threats, onRefresh, onLog }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredThreats = threats.filter(t => {
    const matchesSeverity = filter === 'all' || t.severity === filter;
    const matchesSearch = searchTerm === '' || 
      t.threat_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.source_ip.includes(searchTerm) ||
      t.request_path.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all threat logs? This action cannot be undone.')) {
      try {
        await clearThreats();
        onRefresh();
        onLog('Threat logs cleared successfully', 'success');
      } catch (error) {
        console.error('Failed to clear threats:', error);
        onLog('Failed to clear threat logs', 'danger');
      }
    }
  };

  const exportThreats = () => {
    const csv = [
      ['Timestamp', 'Type', 'Severity', 'Source IP', 'Method', 'Path', 'Status'],
      ...filteredThreats.map(t => [
        t.timestamp,
        t.threat_type,
        t.severity,
        t.source_ip,
        t.request_method,
        t.request_path,
        t.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threats_${new Date().toISOString()}.csv`;
    a.click();
    onLog('Threats exported to CSV', 'success');
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-purple-500',
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Eye className="w-6 h-6 text-cyan-400" />
          Threat Monitor
          <span className="text-sm font-normal text-gray-400">
            ({filteredThreats.length} threats)
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search threats..."
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={exportThreats}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2 transition text-sm"
            disabled={filteredThreats.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="space-y-3 max-h-[700px] overflow-y-auto">
          {filteredThreats.length === 0 ? (
            <div className="text-center py-16">
              {searchTerm || filter !== 'all' ? (
                <>
                  <Filter className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 text-lg">No threats match your filters</p>
                  <button
                    onClick={() => { setSearchTerm(''); setFilter('all'); }}
                    className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 mx-auto mb-3 text-green-400" />
                  <p className="text-gray-400 text-lg">No threats detected</p>
                  <p className="text-gray-500 text-sm mt-2">Your system is secure</p>
                </>
              )}
            </div>
          ) : (
            filteredThreats.map(threat => (
              <ThreatCard key={threat.id} threat={threat} getSeverityBadge={getSeverityBadge} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ThreatCard = ({ threat, getSeverityBadge }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(threat.severity)}`}>
              {threat.severity.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-gray-400">
              {new Date(threat.timestamp).toLocaleString()}
            </span>
            <span className="text-xs px-2 py-1 bg-red-900/50 text-red-200 rounded border border-red-700">
              BLOCKED
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2">{threat.threat_type}</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-400">Source:</span>{' '}
              <span className="font-mono text-cyan-400">{threat.source_ip}</span>
            </p>
            <p>
              <span className="text-gray-400">Request:</span>{' '}
              <span className="font-mono">{threat.request_method} {threat.request_path}</span>
            </p>
            <p>
              <span className="text-gray-400">User Agent:</span>{' '}
              <span className="font-mono text-xs text-gray-500 line-clamp-1">
                {threat.user_agent}
              </span>
            </p>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-gray-400 mb-2">Payload:</p>
                <pre className="p-3 bg-black rounded text-xs overflow-x-auto border border-slate-700">
                  <code className="text-red-400">{threat.payload}</code>
                </pre>
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            {expanded ? '▼ Hide Details' : '▶ Show Details'}
          </button>
        </div>
        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 ml-4" />
      </div>
    </div>
  );
};

export default ThreatMonitor;
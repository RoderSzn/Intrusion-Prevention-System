import React, { useEffect, useRef } from 'react';
import { Terminal, Download } from 'lucide-react';

const LiveLogs = ({ logs }) => {
  const logsEndRef = useRef(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.txt`;
    a.click();
  };

  const getLogColor = (type) => {
    switch(type) {
      case 'danger': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getLogIcon = (type) => {
    switch(type) {
      case 'danger': return '❌';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Terminal className="w-6 h-6 text-cyan-400" />
          System Logs
          <span className="text-sm font-normal text-gray-400">
            ({logs.length} entries)
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              autoScroll ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {autoScroll ? '🔄 Auto-scroll ON' : '⏸️ Auto-scroll OFF'}
          </button>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2 transition"
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Terminal className="w-12 h-12 mx-auto mb-2" />
              <p>No logs yet... Waiting for activity</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-1 hover:bg-slate-900/50 px-2 py-1 rounded transition">
                <span className="text-gray-600">[{log.timestamp}]</span>{' '}
                <span className={getLogColor(log.type)}>
                  {getLogIcon(log.type)} {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-gray-400">Total Logs</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-gray-400">Errors</p>
          <p className="text-2xl font-bold text-red-400">
            {logs.filter(l => l.type === 'danger').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-gray-400">Warnings</p>
          <p className="text-2xl font-bold text-yellow-400">
            {logs.filter(l => l.type === 'warning').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-gray-400">Success</p>
          <p className="text-2xl font-bold text-green-400">
            {logs.filter(l => l.type === 'success').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveLogs;
import React, { useState } from 'react';
import { Settings, Shield, ToggleLeft, ToggleRight, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toggleRule, updateRule, createRule, deleteRule } from '../services/api';

const RulesManager = ({ rules, onRefresh, onLog }) => {
  const [editingRule, setEditingRule] = useState(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pattern: '',
    severity: 'medium'
  });

  const handleToggle = async (ruleId, currentStatus) => {
    try {
      await toggleRule(ruleId);
      onLog(`Rule ${currentStatus ? 'disabled' : 'enabled'}`, 'success');
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      onLog('Failed to toggle rule', 'danger');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description,
      pattern: rule.pattern,
      severity: rule.severity
    });
  };

  const handleSave = async () => {
    try {
      if (creatingRule) {
        await createRule(formData);
        onLog('Rule created successfully', 'success');
        setCreatingRule(false);
      } else {
        await updateRule(editingRule, formData);
        onLog('Rule updated successfully', 'success');
        setEditingRule(null);
      }
      setFormData({ name: '', description: '', pattern: '', severity: 'medium' });
      onRefresh();
    } catch (error) {
      console.error('Failed to save rule:', error);
      onLog('Failed to save rule', 'danger');
    }
  };

  const handleDelete = async (ruleId, ruleName) => {
    if (window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      try {
        await deleteRule(ruleId);
        onLog('Rule deleted successfully', 'success');
        onRefresh();
      } catch (error) {
        console.error('Failed to delete rule:', error);
        onLog('Failed to delete rule', 'danger');
      }
    }
  };

  const handleCancel = () => {
    setEditingRule(null);
    setCreatingRule(false);
    setFormData({ name: '', description: '', pattern: '', severity: 'medium' });
  };

  const getSeverityColor = (severity) => {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          Detection Rules
          <span className="text-sm font-normal text-gray-400">
            ({rules.filter(r => r.enabled).length} active)
          </span>
        </h2>
        <button
          onClick={() => setCreatingRule(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {creatingRule && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4">Create New Rule</h3>
          <RuleForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id}>
              {editingRule === rule.id ? (
                <div className="bg-slate-900 rounded-lg p-4 border border-cyan-500">
                  <h3 className="text-lg font-bold mb-4">Edit Rule</h3>
                  <RuleForm
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </div>
              ) : (
                <RuleCard
                  rule={rule}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  getSeverityColor={getSeverityColor}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RuleForm = ({ formData, setFormData, onSave, onCancel }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">Rule Name</label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
        placeholder="e.g., SQL Injection"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Description</label>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
        placeholder="Describe what this rule detects"
        rows="2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Pattern (Regex)</label>
      <input
        type="text"
        value={formData.pattern}
        onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-sm"
        placeholder="e.g., (SELECT|INSERT|UPDATE|DELETE)"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Severity</label>
      <select
        value={formData.severity}
        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onSave}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
      >
        <Save className="w-4 h-4" />
        Save
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition"
      >
        <X className="w-4 h-4" />
        Cancel
      </button>
    </div>
  </div>
);

const RuleCard = ({ rule, onToggle, onEdit, onDelete, getSeverityColor }) => (
  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-lg">{rule.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(rule.severity)}`}>
            {rule.severity.toUpperCase()}
          </span>
          {!rule.enabled && (
            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
              DISABLED
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mb-3">{rule.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Pattern:</span>{' '}
            <code className="text-xs font-mono bg-slate-800 px-2 py-1 rounded">{rule.pattern}</code>
          </div>
          <div>
            <span className="text-gray-400">Blocked:</span>{' '}
            <span className="text-white font-bold">{rule.blocked_count}</span> attacks
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 ml-4">
        <button
          onClick={() => onToggle(rule.id, rule.enabled)}
          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
            rule.enabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {rule.enabled ? (
            <>
              <ToggleRight className="w-5 h-5" />
              Enabled
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              Disabled
            </>
          )}
        </button>
        <button
          onClick={() => onEdit(rule)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(rule.id, rule.name)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default RulesManager;
import React, { useState, useEffect } from 'react';
import { api } from '../api';

const aiFeatures = [
  { id: 'chat', icon: '💬', title: 'AI HOA Assistant', desc: 'Ask any question about HOA management, governance, or community operations', endpoint: '/ai/chat', fields: [{ key: 'message', label: 'Your Question', type: 'textarea', placeholder: 'Ask anything about HOA management...' }], responseKey: 'response' },
  { id: 'policy', icon: '📋', title: 'AI Policy Generator', desc: 'Generate professional HOA policies, bylaws, and community rules', endpoint: '/ai/generate-policy', fields: [{ key: 'topic', label: 'Policy Topic', placeholder: 'e.g., Pet Policy, Noise Restrictions' }, { key: 'details', label: 'Details & Requirements', type: 'textarea', placeholder: 'Specific requirements or context...' }], responseKey: 'policy' },
  { id: 'conflict', icon: '⚖️', title: 'AI Conflict Resolution', desc: 'Get mediation suggestions and resolution strategies for community disputes', endpoint: '/ai/resolve-conflict', fields: [{ key: 'description', label: 'Conflict Description', type: 'textarea', placeholder: 'Describe the dispute...' }, { key: 'parties', label: 'Parties Involved', placeholder: 'Who is involved?' }], responseKey: 'resolution' },
  { id: 'legal', icon: '🔍', title: 'AI Legal Compliance', desc: 'Check HOA legal compliance questions and get general guidance', endpoint: '/ai/legal-check', fields: [{ key: 'question', label: 'Legal Question', type: 'textarea', placeholder: 'Your compliance question...' }, { key: 'context', label: 'Context', type: 'textarea', placeholder: 'Additional context...' }], responseKey: 'guidance' },
  { id: 'event', icon: '🎉', title: 'AI Event Planner', desc: 'Plan community events with budget, timeline, and logistics', endpoint: '/ai/plan-event', fields: [{ key: 'eventType', label: 'Event Type', placeholder: 'e.g., Summer BBQ, Holiday Party' }, { key: 'budget', label: 'Budget ($)', type: 'number', placeholder: '5000' }, { key: 'attendees', label: 'Expected Attendees', placeholder: '150' }, { key: 'preferences', label: 'Preferences', type: 'textarea', placeholder: 'Any specific requirements...' }], responseKey: 'plan' },
  { id: 'sustainability', icon: '🌱', title: 'AI Sustainability Advisor', desc: 'Get green initiatives and energy-saving recommendations', endpoint: '/ai/sustainability', fields: [{ key: 'communitySize', label: 'Community Size (units)', placeholder: '200' }, { key: 'currentPractices', label: 'Current Practices', type: 'textarea', placeholder: 'What green practices do you have?' }, { key: 'goals', label: 'Sustainability Goals', type: 'textarea', placeholder: 'What are your goals?' }], responseKey: 'recommendations' },
  { id: 'decision', icon: '🎯', title: 'AI Board Decision Helper', desc: 'Analyze options and get data-driven recommendations for board decisions', endpoint: '/ai/board-decision', fields: [{ key: 'topic', label: 'Decision Topic', placeholder: 'What needs to be decided?' }, { key: 'options', label: 'Options', type: 'textarea', placeholder: 'List the available options...' }, { key: 'considerations', label: 'Key Considerations', type: 'textarea', placeholder: 'Budget, timeline, legal requirements...' }], responseKey: 'analysis' },
];

function RateLimitAlert({ onClose }) {
  return (
    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#92400e', fontWeight: 500 }}>⚠️ AI rate limit reached. Please wait before making more AI requests.</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '18px' }}>×</button>
    </div>
  );
}

function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    api.get('/ai-analyses')
      .then(data => {
        setHistory(data);
        // Group by tool_name
        const groups = {};
        data.forEach(item => {
          const key = item.tool_name || 'unknown';
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        setGrouped(groups);
      })
      .catch(err => console.error('Failed to load AI history:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ai-loading"><div className="spinner"></div>Loading AI history...</div>;
  if (history.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
      <p style={{ fontSize: '24px', marginBottom: '8px' }}>📭</p>
      <p>No AI analyses yet. Use any AI tool to see history here.</p>
    </div>
  );

  return (
    <div>
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>{history.length} total AI analyses — grouped by tool</p>
      {Object.entries(grouped).map(([toolName, items]) => (
        <div key={toolName} style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{ background: '#f1f5f9', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === toolName ? null : toolName)}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{toolName.replace(/-/g, ' ')}</strong>
              <span style={{ background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>{items.length}</span>
            </div>
            <span style={{ color: '#94a3b8' }}>{expanded === toolName ? '▲' : '▼'}</span>
          </div>
          {expanded === toolName && (
            <div>
              {items.map((item) => (
                <div key={item.id} style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleString()}</span>
                    {item.entity_type && <span style={{ fontSize: '12px', color: '#7c3aed' }}>{item.entity_type} #{item.entity_id}</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', maxHeight: '120px', overflowY: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {item.result ? item.result.substring(0, 400) + (item.result.length > 400 ? '...' : '') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AICenter() {
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'history'
  const [activeFeature, setActiveFeature] = useState(null);
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const handleFeatureClick = (feature) => {
    setActiveFeature(feature);
    setFormData({});
    setResponse('');
  };

  const handleSubmit = async () => {
    if (!activeFeature || rateLimited) return;
    setLoading(true);
    setResponse('');
    try {
      const data = await api.post(activeFeature.endpoint, formData);
      setResponse(data[activeFeature.responseKey]);
    } catch (err) {
      if (err.message === '__RATE_LIMIT__') {
        setRateLimited(true);
      } else {
        setResponse('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🤖 AI Center</h1>
          <p>Access all AI-powered features for community management</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'tools' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tools')}
          >
            🤖 AI Tools
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            📜 AI History
          </button>
        </div>
      </div>

      {rateLimited && <RateLimitAlert onClose={() => setRateLimited(false)} />}

      {activeTab === 'history' ? (
        <HistoryTab />
      ) : (
        <>
          {activeFeature && (
            <div className="detail-panel" style={{ borderLeft: '4px solid #7c3aed' }}>
              <div className="flex-between">
                <h2>{activeFeature.icon} {activeFeature.title}</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => { setActiveFeature(null); setResponse(''); }}>Close</button>
              </div>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>{activeFeature.desc}</p>

              {activeFeature.fields.map((field) => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] || ''}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}

              <button className="btn btn-ai" onClick={handleSubmit} disabled={loading || rateLimited}>
                {loading ? 'Generating...' : '🤖 Generate AI Response'}
              </button>

              {(response || loading) && (
                <div className="ai-response" style={{ marginTop: '20px' }}>
                  <div className="ai-response-header">
                    <div className="ai-icon">🤖</div>
                    <h3>{activeFeature.title} Response</h3>
                  </div>
                  {loading ? (
                    <div className="ai-loading"><div className="spinner"></div>AI is generating response...</div>
                  ) : (
                    <div className="ai-response-body">{response}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="ai-center-grid">
            {aiFeatures.map((feature) => (
              <div
                key={feature.id}
                className="ai-feature-card"
                onClick={() => handleFeatureClick(feature)}
                style={{ cursor: 'pointer' }}
              >
                <h3><span style={{ fontSize: '24px' }}>{feature.icon}</span> {feature.title}</h3>
                <p>{feature.desc}</p>
                <button className="btn btn-ai btn-sm">Try it</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

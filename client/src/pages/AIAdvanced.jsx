import React, { useState } from 'react';
import { api } from '../api';

const aiFeatures = [
  {
    id: 'violation-enforcement-advisor',
    icon: '⚖️',
    title: 'Violation Enforcement Advisor',
    desc: 'Graduated-enforcement recommendation: action, severity, fine, due-process steps, follow-up window.',
    endpoint: '/ai/violation-enforcement-advisor',
    fields: [
      { key: 'violation_id', label: 'Violation ID *', type: 'number', placeholder: 'e.g. 42' },
    ],
  },
  {
    id: 'reserve-study-projector',
    icon: '📈',
    title: 'Reserve Study Projector',
    desc: 'Multi-year capital reserve projection with annual breakdown, fully-funded percentage, and dues-increase recommendation.',
    endpoint: '/ai/reserve-study-projector',
    fields: [
      { key: 'horizon_years', label: 'Horizon (years)', type: 'number', placeholder: '10' },
      { key: 'current_reserve_balance', label: 'Current Reserve Balance ($)', type: 'number', placeholder: 'e.g. 250000' },
      { key: 'annual_contribution', label: 'Annual Contribution ($)', type: 'number', placeholder: 'e.g. 30000' },
    ],
  },
  {
    id: 'parking-assignment-optimizer',
    icon: '🅿️',
    title: 'Parking Assignment Optimizer',
    desc: 'Optimal parking assignment plan with rationale, unassigned/unfilled lists, and fairness score.',
    endpoint: '/ai/parking-assignment-optimizer',
    fields: [
      { key: 'priority', label: 'Priority Strategy (optional)', placeholder: 'e.g. seniority, proximity, accessibility' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Special considerations (accessibility, EV charging, etc.)' },
    ],
  },
  // Apply pass 4 — mechanical backlog
  {
    id: 'architectural-compliance-scanner',
    icon: '🏛️',
    title: 'Architectural Compliance Scanner',
    desc: 'Scan a homeowner submission against CC&R / ARC guidelines and flag findings.',
    endpoint: '/ai/architectural-compliance-scanner',
    fields: [
      { key: 'request_id', label: 'Architectural Request ID (optional)', type: 'number', placeholder: 'e.g. 14' },
      { key: 'description', label: 'Submission Description', type: 'textarea', placeholder: 'Detached pergola, cedar, 10x12 ft, west-side rear yard' },
      { key: 'design_summary', label: 'Design Summary (materials, colors, dimensions)', type: 'textarea' },
    ],
  },
  {
    id: 'community-engagement-scoring',
    icon: '🤝',
    title: 'Community Engagement Scoring',
    desc: 'Score community engagement and flag at-risk residents.',
    endpoint: '/ai/community-engagement-scoring',
    fields: [
      { key: 'window_days', label: 'Window (days)', type: 'number', placeholder: '90' },
    ],
  },
  {
    id: 'predictive-hoa-forecast',
    icon: '🔮',
    title: 'Predictive HOA Problem Forecast',
    desc: 'Forecast top community risks and recommended budget reserve.',
    endpoint: '/ai/predictive-hoa-forecast',
    fields: [
      { key: 'horizon_days', label: 'Horizon (days)', type: 'number', placeholder: '90' },
    ],
  },
  // Apply pass 5 backlog
  {
    id: 'assessment-audit',
    icon: '📊',
    title: 'Assessment Fairness Audit (Pass 5)',
    desc: 'Audit a batch of property assessments for fairness, consistency, and red flags.',
    endpoint: '/ai/assessment-audit',
    fields: [
      { key: 'property_id', label: 'Property ID (optional)', type: 'number' },
      { key: 'scope', label: 'Audit Scope (optional)', placeholder: 'standard fairness audit' },
    ],
  },
];

function RateLimitAlert({ onClose }) {
  return (
    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#92400e', fontWeight: 500 }}>⚠️ AI rate limit reached. Please wait before making more AI requests.</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '18px' }}>×</button>
    </div>
  );
}

export default function AIAdvanced() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);

  const handleFeatureClick = (feature) => {
    setActiveFeature(feature);
    setFormData({});
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!activeFeature || rateLimited) return;
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const body = {};
      activeFeature.fields.forEach(f => {
        const v = formData[f.key];
        if (v !== undefined && v !== '') {
          body[f.key] = f.type === 'number' ? Number(v) : v;
        }
      });
      const data = await api.post(activeFeature.endpoint, body);
      setResponse(data);
    } catch (err) {
      if (err.message === '__RATE_LIMIT__') {
        setRateLimited(true);
      } else {
        setError(err.message || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderResponse = () => {
    if (!response) return null;
    const candidate = response.recommendation || response.projection || response.plan
      || response.analysis || response.result || response.data;
    if (typeof candidate === 'string') {
      return <div className="ai-response-body">{candidate}</div>;
    }
    return (
      <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: 600 }}>
{JSON.stringify(response, null, 2)}
      </pre>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>⚡ Advanced AI Tools</h1>
          <p>Enforcement advisor, reserve study projector, and parking assignment optimizer.</p>
        </div>
      </div>

      {rateLimited && <RateLimitAlert onClose={() => setRateLimited(false)} />}

      {activeFeature && (
        <div className="detail-panel" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div className="flex-between">
            <h2>{activeFeature.icon} {activeFeature.title}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => { setActiveFeature(null); setResponse(null); setError(null); }}>Close</button>
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

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginTop: '16px' }}>
              {error}
            </div>
          )}

          {(response || loading) && (
            <div className="ai-response" style={{ marginTop: '20px' }}>
              <div className="ai-response-header">
                <div className="ai-icon">🤖</div>
                <h3>{activeFeature.title} Response</h3>
              </div>
              {loading ? (
                <div className="ai-loading"><div className="spinner"></div>AI is generating response...</div>
              ) : renderResponse()}
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
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const cards = [
  { key: 'totalResidents', label: 'Total Residents', icon: '👥', color: '#dbeafe', path: '/residents' },
  { key: 'totalProperties', label: 'Properties', icon: '🏘️', color: '#dcfce7', path: '/properties' },
  { key: 'openMaintenance', label: 'Open Maintenance', icon: '🔧', color: '#fef3c7', path: '/maintenance' },
  { key: 'openViolations', label: 'Open Violations', icon: '⚠️', color: '#fee2e2', path: '/violations' },
  { key: 'totalIncome', label: 'Total Income', icon: '💰', color: '#dcfce7', path: '/finances', prefix: '$' },
  { key: 'totalExpenses', label: 'Total Expenses', icon: '💸', color: '#fee2e2', path: '/finances', prefix: '$' },
  { key: 'upcomingMeetings', label: 'Upcoming Meetings', icon: '📅', color: '#f3e8ff', path: '/meetings' },
  { key: 'totalBookings', label: 'Amenity Bookings', icon: '🏊', color: '#dbeafe', path: '/amenities' },
];

const features = [
  { path: '/residents', icon: '👥', color: '#dbeafe', title: 'Resident Management', desc: 'Manage residents, communication, and profiles with AI assistance' },
  { path: '/properties', icon: '🏘️', color: '#dcfce7', title: 'Property Management', desc: 'Track properties, valuations, and AI-powered analysis' },
  { path: '/maintenance', icon: '🔧', color: '#fef3c7', title: 'Maintenance Requests', desc: 'Handle requests with AI priority assessment and cost estimation' },
  { path: '/finances', icon: '💰', color: '#dcfce7', title: 'Financial Management', desc: 'Budget tracking with AI forecasting and analysis' },
  { path: '/violations', icon: '⚠️', color: '#fee2e2', title: 'Violation Tracking', desc: 'Track violations with AI letter generation and severity assessment' },
  { path: '/meetings', icon: '📅', color: '#f3e8ff', title: 'Meeting Management', desc: 'Schedule meetings with AI agenda and minutes generation' },
  { path: '/documents', icon: '📄', color: '#f1f5f9', title: 'Document Management', desc: 'Store and manage documents with AI summarization' },
  { path: '/amenities', icon: '🏊', color: '#dbeafe', title: 'Amenity Booking', desc: 'Book amenities with AI usage optimization' },
  { path: '/vendors', icon: '🤝', color: '#fef3c7', title: 'Vendor Management', desc: 'Manage vendors with AI evaluation and recommendations' },
  { path: '/communications', icon: '📢', color: '#dcfce7', title: 'Communications', desc: 'Send communications with AI newsletter and announcement generation' },
  { path: '/architectural', icon: '🏗️', color: '#f3e8ff', title: 'Architectural Review', desc: 'Review modifications with AI compliance analysis' },
  { path: '/emergency', icon: '🚨', color: '#fee2e2', title: 'Emergency Management', desc: 'Emergency plans with AI response planning' },
  { path: '/parking', icon: '🅿️', color: '#dbeafe', title: 'Parking Management', desc: 'Manage parking with AI optimization and allocation' },
  { path: '/ai-center', icon: '🤖', color: '#f3e8ff', title: 'AI Center', desc: 'Access all AI features: policy generation, conflict resolution, and more' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [aiInsights, setAiInsights] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(setStats).catch(console.error);
  }, []);

  const getInsights = async () => {
    setLoadingAI(true);
    try {
      const data = await api.post('/dashboard/ai-insights', stats);
      setAiInsights(data.insights);
    } catch (err) {
      setAiInsights('Error: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const formatValue = (card) => {
    const val = stats[card.key];
    if (val === undefined) return '...';
    if (card.prefix) return `${card.prefix}${Number(val).toLocaleString()}`;
    return val;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to Sunset Ridge Community Association Manager</p>
        </div>
        <button className="btn btn-ai" onClick={getInsights} disabled={loadingAI}>
          {loadingAI ? 'Analyzing...' : '🤖 AI Community Insights'}
        </button>
      </div>

      {(aiInsights || loadingAI) && (
        <div className="ai-response mb-4">
          <div className="ai-response-header">
            <div className="ai-icon">🤖</div>
            <h3>AI Community Insights</h3>
          </div>
          {loadingAI ? (
            <div className="ai-loading"><div className="spinner"></div>Analyzing community data...</div>
          ) : (
            <div className="ai-response-body">{aiInsights}</div>
          )}
        </div>
      )}

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div key={card.key} className="stat-card" onClick={() => navigate(card.path)}>
            <div className="stat-card-icon" style={{ background: card.color }}>{card.icon}</div>
            <h3>{card.label}</h3>
            <div className="stat-value">{formatValue(card)}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div>
          <h1>Features</h1>
          <p>All community management features with AI integration</p>
        </div>
      </div>

      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

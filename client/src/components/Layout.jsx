import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { section: 'Overview', items: [
    { path: '/', label: 'Dashboard', icon: '📊' },
  ]},
  { section: 'Management', items: [
    { path: '/residents', label: 'Residents', icon: '👥' },
    { path: '/properties', label: 'Properties', icon: '🏘️' },
    { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
    { path: '/finances', label: 'Finances', icon: '💰' },
    { path: '/violations', label: 'Violations', icon: '⚠️' },
    { path: '/meetings', label: 'Meetings', icon: '📅' },
    { path: '/documents', label: 'Documents', icon: '📄' },
  ]},
  { section: 'Operations', items: [
    { path: '/amenities', label: 'Amenities', icon: '🏊' },
    { path: '/vendors', label: 'Vendors', icon: '🤝' },
    { path: '/communications', label: 'Communications', icon: '📢' },
    { path: '/architectural', label: 'Architectural', icon: '🏗️' },
    { path: '/emergency', label: 'Emergency', icon: '🚨' },
    { path: '/parking', label: 'Parking', icon: '🅿️' },
  ]},
  { section: 'AI', items: [
    { path: '/ai-center', label: 'AI Center', icon: '🤖' },
  ]},
];

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>AI HOA Manager</h2>
          <p>Sunset Ridge Community</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div className="sidebar-section" key={section.section}>
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <button
                  key={item.path}
                  className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name?.[0] || 'A'}</div>
            <div className="sidebar-user-info">
              <p>{user.name}</p>
              <span>{user.role}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm btn-full mt-2" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

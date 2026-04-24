import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Properties from './pages/Properties';
import Maintenance from './pages/Maintenance';
import Finances from './pages/Finances';
import Violations from './pages/Violations';
import Meetings from './pages/Meetings';
import Documents from './pages/Documents';
import Amenities from './pages/Amenities';
import Vendors from './pages/Vendors';
import Communications from './pages/Communications';
import Architectural from './pages/Architectural';
import Emergency from './pages/Emergency';
import Parking from './pages/Parking';
import AICenter from './pages/AICenter';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/architectural" element={<Architectural />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/parking" element={<Parking />} />
          <Route path="/ai-center" element={<AICenter />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

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
import AIAdvanced from './pages/AIAdvanced';
import AppealsAndBallots from './pages/AppealsAndBallots';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticCommunityManagerHandlingRouti from './pages/CfAgenticCommunityManagerHandlingRouti';
import CfArchitecturalComplianceScannerFlaggin from './pages/CfArchitecturalComplianceScannerFlaggin';
import CfPredictiveCommunityConflictForecastin from './pages/CfPredictiveCommunityConflictForecastin';
import CfReserveStudyLongTermCapitalPlanner from './pages/CfReserveStudyLongTermCapitalPlanner';
import CfParkingAndAmenityAssignmentOptimizer from './pages/CfParkingAndAmenityAssignmentOptimizer';
import CfCommunityEngagementRetentionScoringW from './pages/CfCommunityEngagementRetentionScoringW';
import GapNoViolationEnforcementSeverityAdviso from './pages/GapNoViolationEnforcementSeverityAdviso';
import GapNoReserveStudyProjectorForCapital from './pages/GapNoReserveStudyProjectorForCapital';
import GapNoPropertyAssessmentFairnessAudit from './pages/GapNoPropertyAssessmentFairnessAudit';
import GapNoParkingAssignmentOptimizer from './pages/GapNoParkingAssignmentOptimizer';
import GapNoPaymentProcessingIntegration from './pages/GapNoPaymentProcessingIntegration';
import GapNoHomeownerSelfServicePortalBeyond from './pages/GapNoHomeownerSelfServicePortalBeyond';
import GapNoWebhookSurface from './pages/GapNoWebhookSurface';
import GapNoFileUploadPipelineForArchitectura from './pages/GapNoFileUploadPipelineForArchitectura';
import GapNoRealTimeMeetingStreaming from './pages/GapNoRealTimeMeetingStreaming';

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

  // Listen for 401 redirect triggered by api.js
  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem('token');
      if (!token && user) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

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
          <Route path="/ai-advanced" element={<AIAdvanced />} />
          <Route path="/governance" element={<AppealsAndBallots />} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-community-manager-handling-routi" element={<CfAgenticCommunityManagerHandlingRouti />} />
          <Route path="/cf-architectural-compliance-scanner-flaggin" element={<CfArchitecturalComplianceScannerFlaggin />} />
          <Route path="/cf-predictive-community-conflict-forecastin" element={<CfPredictiveCommunityConflictForecastin />} />
          <Route path="/cf-reserve-study-long-term-capital-planner" element={<CfReserveStudyLongTermCapitalPlanner />} />
          <Route path="/cf-parking-and-amenity-assignment-optimizer" element={<CfParkingAndAmenityAssignmentOptimizer />} />
          <Route path="/cf-community-engagement-retention-scoring-w" element={<CfCommunityEngagementRetentionScoringW />} />
          <Route path="/gap-no-violation-enforcement-severity-adviso" element={<GapNoViolationEnforcementSeverityAdviso />} />
          <Route path="/gap-no-reserve-study-projector-for-capital" element={<GapNoReserveStudyProjectorForCapital />} />
          <Route path="/gap-no-property-assessment-fairness-audit" element={<GapNoPropertyAssessmentFairnessAudit />} />
          <Route path="/gap-no-parking-assignment-optimizer" element={<GapNoParkingAssignmentOptimizer />} />
          <Route path="/gap-no-payment-processing-integration" element={<GapNoPaymentProcessingIntegration />} />
          <Route path="/gap-no-homeowner-self-service-portal-beyond" element={<GapNoHomeownerSelfServicePortalBeyond />} />
          <Route path="/gap-no-webhook-surface" element={<GapNoWebhookSurface />} />
          <Route path="/gap-no-file-upload-pipeline-for-architectura" element={<GapNoFileUploadPipelineForArchitectura />} />
          <Route path="/gap-no-real-time-meeting-streaming" element={<GapNoRealTimeMeetingStreaming />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import MedicineSearchPage from './pages/MedicineSearchPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage'; 
import DietPlannerPage from './pages/DietPlannerPage';
import ProtectedRoute from './utils/ProtectedRoute';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import ReportAnalysisPage from './pages/ReportAnalysisPage';

function App() {
  return (
    <AuthProvider>
      <Header />
      <Container className="my-5">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OTPPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/medicine-info" element={<ProtectedRoute><MedicineSearchPage /></ProtectedRoute>} />
          <Route path="/symptom-checker" element={<ProtectedRoute><SymptomCheckerPage /></ProtectedRoute>} />
          <Route path="/diet-planner" element={<ProtectedRoute><DietPlannerPage /></ProtectedRoute>} />
          <Route path="/report-analysis" element={<ProtectedRoute><ReportAnalysisPage /></ProtectedRoute>} />
        </Routes>
      </Container>
    </AuthProvider>
  );
}

export default App;
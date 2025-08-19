import React, { useState, useEffect, useContext } from 'react';
import { Card, Col, Row, Spinner, Alert, Button, Form, InputGroup, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaStethoscope, FaAppleAlt, FaPills, FaFileMedicalAlt, FaChartLine, FaHeartbeat } from 'react-icons/fa';
import api from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
import './HomePage.css'; // Import CSS file

const HomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, dashboardRefresh } = useContext(AuthContext);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/data/');
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err.response || err.message || err);
      setError('Could not load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dashboardRefresh]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner animation="border" />
        <p>Loading your health dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="dashboard-error mt-3">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
        <Button className="retry-btn ms-2" onClick={fetchData}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="dashboard-container p-4">
      <Container fluid>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h1 className="dashboard-greeting">
            <i className="bi bi-sun me-2"></i>
            {getGreeting()}, {user?.username}!
          </h1>
          <div className="d-flex align-items-center text-muted">
            <i className="bi bi-calendar-event me-2"></i>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Quick Action Cards */}
        <Row className="mb-5">
          <QuickActionCard 
            to="/symptom-checker" 
            title="Symptom Checker" 
            text="AI-powered symptom analysis" 
            icon={<FaStethoscope size={40} className="text-primary" />} 
          />
          <QuickActionCard 
            to="/medicine-info" 
            title="Medicine Info" 
            text="Comprehensive drug database" 
            icon={<FaPills size={40} className="text-warning" />} 
          />
          <QuickActionCard 
            to="/diet-planner" 
            title="Diet Planner" 
            text="Personalized meal plans" 
            icon={<FaAppleAlt size={40} className="text-success" />} 
          />
          <QuickActionCard 
            to="/report-analysis" 
            title="Report Analysis" 
            text="Medical report insights" 
            icon={<FaFileMedicalAlt size={40} className="text-info" />} 
          />
        </Row>

        <Row>
          <Col lg={4} className="mb-4">
            <HealthSnapshot data={dashboardData?.health_snapshot} />
          </Col>
          <Col lg={8} className="mb-4">
            <WeightProgress data={dashboardData?.weight_progress} fetchData={fetchData} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

// Helper Components
const QuickActionCard = ({ to, title, text, icon }) => (
  <Col md={6} lg={3} className="mb-3">
    <Card as={Link} to={to} className="quick-action-card">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
        <div className="quick-action-icon">{icon}</div>
        <h6 className="quick-action-title">{title}</h6>
        <p className="quick-action-text">{text}</p>
      </Card.Body>
    </Card>
  </Col>
);

const HealthSnapshot = ({ data }) => (
  <Card className="health-snapshot-card">
    <Card.Body>
      <h5 className="health-snapshot-title">
        <FaHeartbeat className="me-2 text-danger" />
        Your Health Snapshot
      </h5>
      <div className="d-flex justify-content-between flex-wrap">
        <div className="health-metric-box">
          <p className="health-metric-label">BMI</p>
          <h4 className="health-metric-value">{data?.bmi?.value || 'N/A'}</h4>
          <small className="health-metric-category">
            {data?.bmi?.category || 'Complete profile for data'}
          </small>
        </div>
        <div className="health-metric-box">
          <p className="health-metric-label">BMR</p>
          <h4 className="health-metric-value">{data?.bmr?.value || 'N/A'}</h4>
          <small className="health-metric-category">calories/day</small>
        </div>
      </div>
      {(!data?.bmi?.value || !data?.bmr?.value) && (
        <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <small className="text-warning">
            <i className="bi bi-info-circle me-2"></i>
            <Link to="/profile" className="text-decoration-none fw-semibold" style={{ color: '#856404' }}>
              Complete your profile
            </Link> to see accurate health metrics.
          </small>
        </div>
      )}
    </Card.Body>
  </Card>
);

const WeightProgress = ({ data, fetchData }) => {
  const [newWeight, setNewWeight] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleLogWeight = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) return;
    
    setIsLogging(true);
    try {
      await api.post('/dashboard/log-weight/', { weight: parseFloat(newWeight) });
      setNewWeight('');
      fetchData();
    } catch (err) {
      console.error('Failed to log weight:', err);
    } finally {
      setIsLogging(false);
    }
  };

  const daysLogged = data?.length || 0;
  const adherence = Math.round((daysLogged / 30) * 100);

  return (
    <Card className="weight-progress-card">
      <Card.Body>
        <h5 className="weight-progress-title">
          <FaChartLine className="me-2 text-primary" />
          Weight Progress Tracker
        </h5>
        
        <div className="adherence-badge">
          <i className="bi bi-trophy-fill me-2"></i>
          {adherence}% Adherence ({daysLogged}/30 days logged)
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
                stroke="#8c8c94"
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']} 
                stroke="#8c8c94"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #b4bcbc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight_kg" 
                stroke="#2860a1" 
                strokeWidth={3}
                dot={{ fill: '#2860a1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2860a1', strokeWidth: 2 }}
                name="Weight (kg)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <InputGroup className="weight-input-group">
          <Form.Control 
            type="number" 
            step="0.1" 
            placeholder="Enter today's weight (kg)" 
            value={newWeight} 
            onChange={(e) => setNewWeight(e.target.value)}
            className="weight-input"
          />
          <Button 
            className="weight-log-btn" 
            onClick={handleLogWeight}
            disabled={isLogging || !newWeight}
          >
            {isLogging ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Logging...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Log Weight
              </>
            )}
          </Button>
        </InputGroup>
      </Card.Body>
    </Card>
  );
};

export default HomePage;

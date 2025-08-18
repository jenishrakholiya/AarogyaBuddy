// HomePage.js (Full, updated code with refresh trigger for BMI update after redirect)
import React, { useState, useEffect, useContext } from 'react';
import { Card, Col, Row, Spinner, Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaStethoscope, FaAppleAlt, FaPills, FaFileMedicalAlt, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import api from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';

const HomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, dashboardRefresh } = useContext(AuthContext);  // Get refresh trigger from context

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

  // Refetch data on initial mount and whenever dashboardRefresh changes (e.g., after profile update)
  useEffect(() => {
    fetchData();
  }, [dashboardRefresh]);  // Dependency on dashboardRefresh ensures update after profile changes

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger" className="mt-3">{error} <Button variant="link" onClick={fetchData}>Retry</Button></Alert>;

  return (
    <div className="dashboard-container p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h2 className="mb-4 text-primary">{getGreeting()}, {user?.username}!</h2>
      {/* Quick Action Cards */}
      <Row className="mb-4">
        <QuickActionCard to="/symptom-checker" title="Symptom Checker" text="Log and analyze symptoms" icon={<FaStethoscope size={40} className="text-primary" />} />
        <QuickActionCard to="/medicine-info" title="Medicine Info" text="Search and track meds" icon={<FaPills size={40} className="text-warning" />} />
        <QuickActionCard to="/diet-planner" title="Diet Planner" text="View daily meal plans" icon={<FaAppleAlt size={40} className="text-success" />} />
        <QuickActionCard to="/report-analysis" title="Report Analysis" text="Upload and review reports" icon={<FaFileMedicalAlt size={40} className="text-info" />} />
      </Row>
      <Row>
        <Col lg={4} className="mb-4 d-flex flex-column">
          {/* Health Snapshot (BMI/BMR) */}
          <HealthSnapshot data={dashboardData?.health_snapshot} />
          {/* Daily Diet Tracker */}
        </Col>
        <Col lg={8} className="mb-4 d-flex flex-column">
          {/* Weight & Goal Progress */}
          <WeightProgress data={dashboardData?.weight_progress} fetchData={fetchData} />
        </Col>
      </Row>
    </div>
  );
};

// Helper Components
const QuickActionCard = ({ to, title, text, icon }) => (
  <Col md={6} lg={3} className="mb-3">
    <Card as={Link} to={to} className="text-decoration-none h-100 text-center shadow-sm border-0 hover-shadow">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        <div className="mb-3">{icon}</div>
        <Card.Title as="h6" className="text-dark">{title}</Card.Title>
        <Card.Text className="small text-muted">{text}</Card.Text>
      </Card.Body>
    </Card>
  </Col>
);

const HealthSnapshot = ({ data }) => (
  <Card className="shadow-sm mb-4 border-0">
    <Card.Body>
      <Card.Title as="h5" className="text-dark mb-3">Your Health Snapshot</Card.Title>
      <div className="d-flex justify-content-around text-center">
        <div className="p-3 rounded" style={{ backgroundColor: '#e9f7ef', width: '45%' }}>
          <p className="mb-1 text-muted small">BMI</p>
          <h4 className="fw-bold text-primary">{data?.bmi?.value || 'N/A'}</h4>
          <small className="text-secondary">{data?.bmi?.category || 'Complete profile for accurate data'}</small>
        </div>
        <div className="p-3 rounded" style={{ backgroundColor: '#e9f7ef', width: '45%' }}>
          <p className="mb-1 text-muted small">BMR</p>
          <h4 className="fw-bold text-primary">{data?.bmr?.value || 'N/A'}</h4>
          <small className="text-secondary">calories/day</small>
        </div>
      </div>
    </Card.Body>
  </Card>
);


const WeightProgress = ({ data, fetchData }) => {
  const [newWeight, setNewWeight] = useState('');

  const handleLogWeight = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) return;
    try {
      await api.post('/dashboard/log-weight/', { weight: parseFloat(newWeight) });
      setNewWeight('');
      fetchData();
    } catch (err) {
      console.error('Failed to log weight:', err);
    }
  };

  const daysLogged = data?.length || 0;
  const adherence = Math.round((daysLogged / 30) * 100);

  return (
    <Card className="shadow-sm mb-4 border-0">
      <Card.Body>
        <Card.Title as="h5" className="text-dark mb-3">Weight & Goal Progress (Last 30 Days)</Card.Title>
        <div className="mb-3">
          <small className="text-muted">Adherence: {adherence}% (Logged {daysLogged} days)</small>
        </div>
        <div style={{ height: '200px' }} className="mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip />
              <Line type="monotone" dataKey="weight_kg" stroke="#8884d8" strokeWidth={2} name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <InputGroup>
          <Form.Control type="number" step="0.1" placeholder="Log today's weight (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
          <Button variant="primary" onClick={handleLogWeight}>Log</Button>
        </InputGroup>
      </Card.Body>
    </Card>
  );
};

export default HomePage;






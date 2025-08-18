import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    username: '', email: '', age: null, gender: 'Male', weight_kg: null, height_cm: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { triggerDashboardRefresh } = useContext(AuthContext);  // For refreshing dashboard after update

  useEffect(() => {
    api.get('/auth/profile/')
      .then(response => {
        const data = response.data;
        // Convert null to empty strings for form display
        for (const key in data) {
          if (data[key] === null) {
            data[key] = '';
          }
        }
        setProfileData(data);
      })
      .catch((error) => {
        console.error('Profile load error:', error.response || error.message || error);
        setError('Failed to load profile data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Parse values to ensure correct types (int/float) and handle empty strings
    const parsedAge = profileData.age ? parseInt(profileData.age, 10) : null;
    const parsedWeight = profileData.weight_kg ? parseFloat(profileData.weight_kg) : null;
    const parsedHeight = profileData.height_cm ? parseFloat(profileData.height_cm) : null;

    // Basic client-side validation
    if (parsedAge && (parsedAge < 1 || parsedAge > 100)) {
      setError('Age must be between 1 and 100.');
      setSaving(false);
      return;
    }
    if (parsedWeight && parsedWeight <= 0) {
      setError('Weight must be a positive number.');
      setSaving(false);
      return;
    }
    if (parsedHeight && parsedHeight <= 0) {
      setError('Height must be a positive number.');
      setSaving(false);
      return;
    }
    if (!profileData.gender) {
      setError('Gender is required.');
      setSaving(false);
      return;
    }

    const payload = {
      age: parsedAge,
      gender: profileData.gender,
      weight_kg: parsedWeight,
      height_cm: parsedHeight,
    };

    try {
      await api.put('/auth/profile/', payload);
      setSuccess('Profile updated successfully! Redirecting to dashboard...');
      triggerDashboardRefresh();  // Trigger dashboard refresh
      setTimeout(() => navigate('/'), 2000);  // Redirect after 2 seconds
    } catch (err) {
      console.error('Profile update error:', err.response || err.message || err);
      setError('Failed to update profile. Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Card className="shadow-sm">
      <Card.Header as="h3">Your Profile</Card.Header>
      <Card.Body>
        <p className="text-muted">
          Please fill out your health details. This information is used to personalize your experience on the dashboard and in the diet planner.
        </p>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6} className="mb-3"><Form.Group><Form.Label>Username</Form.Label><Form.Control type="text" value={profileData.username || ''} readOnly disabled /></Form.Group></Col>
            <Col md={6} className="mb-3"><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={profileData.email || ''} readOnly disabled /></Form.Group></Col>
          </Row>
          <hr />
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Age</Form.Label>
                <Form.Control 
                  type="number" 
                  name="age" 
                  value={profileData.age || ''} 
                  onChange={handleInputChange} 
                  min="1"  // Min 1
                  max="100"  // Max 100
                  required  // Make required
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Gender</Form.Label>
                <Form.Select 
                  name="gender" 
                  value={profileData.gender || 'Male'} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Weight (kg)</Form.Label>
                <Form.Control 
                  type="number" 
                  step="0.1" 
                  name="weight_kg" 
                  value={profileData.weight_kg || ''} 
                  onChange={handleInputChange} 
                  min="0.1"  // Positive min
                  required 
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Height (cm)</Form.Label>
                <Form.Control 
                  type="number" 
                  name="height_cm" 
                  value={profileData.height_cm || ''} 
                  onChange={handleInputChange} 
                  required 
                />
              </Form.Group>
            </Col>
          </Row>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          {success && <Alert variant="success" className="mt-3">{success}</Alert>}
          <div className="text-end mt-3">
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner as="span" animation="border" size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ProfilePage;
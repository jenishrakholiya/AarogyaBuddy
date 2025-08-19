import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert, Container, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
import './ProfilePage.css'; // Import CSS file

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    username: '', email: '', age: null, gender: 'Male', weight_kg: null, height_cm: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const navigate = useNavigate();
  const { triggerDashboardRefresh } = useContext(AuthContext);

  useEffect(() => {
    api.get('/auth/profile/')
      .then(response => {
        const data = response.data;
        for (const key in data) {
          if (data[key] === null) {
            data[key] = '';
          }
        }
        setProfileData(data);
        calculateCompletion(data);
      })
      .catch((error) => {
        console.error('Profile load error:', error.response || error.message || error);
        setError('Failed to load profile data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const calculateCompletion = (data) => {
    const fields = ['age', 'gender', 'weight_kg', 'height_cm'];
    const filled = fields.filter(field => data[field] && data[field] !== '').length;
    const percentage = Math.round((filled / fields.length) * 100);
    setCompletionPercentage(percentage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...profileData, [name]: value };
    setProfileData(newData);
    calculateCompletion(newData);
  };

  const calculateBMI = () => {
    if (profileData.weight_kg && profileData.height_cm) {
      const heightInMeters = profileData.height_cm / 100;
      const bmi = profileData.weight_kg / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Underweight', variant: 'info' };
    if (bmi < 25) return { text: 'Normal', variant: 'success' };
    if (bmi < 30) return { text: 'Overweight', variant: 'warning' };
    return { text: 'Obese', variant: 'danger' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const parsedAge = profileData.age ? parseInt(profileData.age, 10) : null;
    const parsedWeight = profileData.weight_kg ? parseFloat(profileData.weight_kg) : null;
    const parsedHeight = profileData.height_cm ? parseFloat(profileData.height_cm) : null;

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

    const payload = {
      age: parsedAge,
      gender: profileData.gender,
      weight_kg: parsedWeight,
      height_cm: parsedHeight,
    };

    try {
      await api.put('/auth/profile/', payload);
      setSuccess('Profile updated successfully! Redirecting to dashboard...');
      triggerDashboardRefresh();
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Profile update error:', err.response || err.message || err);
      setError('Failed to update profile. Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="profile-loading">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading your profile...</p>
        </div>
      </Container>
    );
  }

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="profile-container py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Card className="profile-card overflow-hidden">
              <div className="profile-header p-4">
                <Row className="align-items-center">
                  <Col>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle display-4 me-3"></i>
                      <div>
                        <h2 className="mb-1 fw-bold">Your Health Profile</h2>
                        <p className="mb-0 opacity-75">Personalize your Aarogya Buddy experience</p>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Badge className="completion-badge px-3 py-2 rounded-pill fs-6">
                      <i className="bi bi-check-circle me-1"></i>
                      {completionPercentage}% Complete
                    </Badge>
                  </Col>
                </Row>
                <ProgressBar 
                  now={completionPercentage} 
                  variant="success" 
                  className="mt-3"
                  style={{ height: '6px' }}
                />
              </div>

              <Card.Body className="p-4 p-md-5">
                {/* BMI Display */}
                {bmi && (
                  <Row className="mb-5">
                    <Col md={6}>
                      <div className="info-card p-4 text-center">
                        <i className="bi bi-speedometer2 display-6 text-primary mb-2"></i>
                        <h5 className="fw-bold text-dark mb-1">Your BMI</h5>
                        <div className="bmi-display">{bmi}</div>
                        <Badge bg={bmiCategory.variant} className="mt-2 px-3 py-2 rounded-pill">
                          {bmiCategory.text}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={6} className="mt-3 mt-md-0">
                      <div className="info-card p-4 text-center">
                        <i className="bi bi-heart-pulse display-6 text-success mb-2"></i>
                        <h5 className="fw-bold text-dark mb-3">Health Insights</h5>
                        <div className="text-muted small">
                          {completionPercentage === 100 ? (
                            <span className="text-success">
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Profile complete! Ready for personalized recommendations.
                            </span>
                          ) : (
                            <span>
                              <i className="bi bi-info-circle me-1"></i>
                              Complete your profile for better health insights.
                            </span>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Alerts */}
                {error && (
                  <Alert variant="danger" className="border-0 rounded-3 mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" className="border-0 rounded-3 mb-4">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <div className="mb-4">
                    <h4 className="fw-bold text-dark mb-3">
                      <i className="bi bi-person me-2 text-primary"></i>
                      Basic Information
                    </h4>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="bi bi-person-badge me-2 text-muted"></i>
                            Username
                          </Form.Label>
                          <Form.Control 
                            type="text" 
                            value={profileData.username || ''} 
                            readOnly 
                            disabled 
                            className="form-control-custom bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="bi bi-envelope me-2 text-muted"></i>
                            Email Address
                          </Form.Label>
                          <Form.Control 
                            type="email" 
                            value={profileData.email || ''} 
                            readOnly 
                            disabled 
                            className="form-control-custom bg-light"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <hr className="my-4" />

                  {/* Health Information */}
                  <div className="mb-4">
                    <h4 className="fw-bold text-dark mb-3">
                      <i className="bi bi-heart-pulse me-2 text-danger"></i>
                      Health Details
                    </h4>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="bi bi-calendar-event me-2 text-muted"></i>
                            Age <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="number" 
                            name="age" 
                            value={profileData.age || ''} 
                            onChange={handleInputChange}
                            className="form-control-custom"
                            placeholder="Enter your age"
                            min="1"
                            max="100"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="bi bi-gender-ambiguous me-2 text-muted"></i>
                            Gender <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select 
                            name="gender" 
                            value={profileData.gender || 'Male'} 
                            onChange={handleInputChange}
                            className="form-control-custom"
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
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="bi bi-speedometer me-2 text-muted"></i>
                            Weight (kg) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="number" 
                            step="0.1" 
                            name="weight_kg" 
                            value={profileData.weight_kg || ''} 
                            onChange={handleInputChange}
                            className="form-control-custom"
                            placeholder="Enter your weight"
                            min="0.1"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark mb-2">
                            <i className="bi bi-rulers me-2 text-muted"></i>
                            Height (cm) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="number" 
                            name="height_cm" 
                            value={profileData.height_cm || ''} 
                            onChange={handleInputChange}
                            className="form-control-custom"
                            placeholder="Enter your height"
                            min="50"
                            max="300"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3">
                    <Button variant="outline-secondary" onClick={() => navigate('/')}>
                      <i className="bi bi-arrow-left me-2"></i>
                      Back to Dashboard
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-login px-4"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProfilePage;

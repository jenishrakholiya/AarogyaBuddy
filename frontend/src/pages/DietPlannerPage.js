import React, { useState } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert, Container } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';
import './DietPlannerPage.css'; // Import CSS file

const DietPlannerPage = () => {
    const [formData, setFormData] = useState({
        age: '',
        gender: 'Male',
        weight: '',
        height: '',
        activity_level: 'Lightly Active',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await api.post('/diet-plans/generate/', formData);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate diet plan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="diet-planner-container">
            <Container>
                <Card className="diet-planner-card">
                    <div className="diet-planner-header">
                        <i className="bi bi-apple display-4 mb-3"></i>
                        <h2 className="diet-planner-title">
                            Personalized Diet & Workout Planner
                        </h2>
                        <p className="diet-planner-subtitle">
                            Get AI-powered nutrition and fitness recommendations tailored to your body
                        </p>
                    </div>
                    <div className="diet-planner-body">
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6} className="diet-form-group">
                                    <Form.Label className="diet-form-label">
                                        <i className="bi bi-person me-2"></i>
                                        Your Age
                                    </Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="age" 
                                        value={formData.age} 
                                        onChange={handleInputChange} 
                                        className="diet-form-control"
                                        placeholder="Enter your age"
                                        required 
                                        min="18" 
                                    />
                                </Col>
                                <Col md={6} className="diet-form-group">
                                    <Form.Label className="diet-form-label">
                                        <i className="bi bi-gender-ambiguous me-2"></i>
                                        Your Gender
                                    </Form.Label>
                                    <Form.Select 
                                        name="gender" 
                                        value={formData.gender} 
                                        onChange={handleInputChange}
                                        className="diet-form-select"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6} className="diet-form-group">
                                    <Form.Label className="diet-form-label">
                                        <i className="bi bi-speedometer me-2"></i>
                                        Weight (kg)
                                    </Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="weight" 
                                        value={formData.weight} 
                                        onChange={handleInputChange} 
                                        className="diet-form-control"
                                        placeholder="Enter your weight"
                                        required 
                                    />
                                </Col>
                                <Col md={6} className="diet-form-group">
                                    <Form.Label className="diet-form-label">
                                        <i className="bi bi-rulers me-2"></i>
                                        Height (cm)
                                    </Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="height" 
                                        value={formData.height} 
                                        onChange={handleInputChange} 
                                        className="diet-form-control"
                                        placeholder="Enter your height"
                                        required 
                                    />
                                </Col>
                            </Row>
                            <div className="diet-form-group">
                                <Form.Label className="diet-form-label">
                                    <i className="bi bi-lightning me-2"></i>
                                    Daily Activity Level
                                </Form.Label>
                                <Form.Select 
                                    name="activity_level" 
                                    value={formData.activity_level} 
                                    onChange={handleInputChange}
                                    className="diet-form-select"
                                >
                                    <option value="Sedentary">Sedentary (Little or no exercise)</option>
                                    <option value="Lightly Active">Lightly Active (Light exercise 1-3 days/week)</option>
                                    <option value="Moderately Active">Moderately Active (Moderate exercise 3-5 days/week)</option>
                                    <option value="Very Active">Very Active (Hard exercise 6-7 days/week)</option>
                                    <option value="Super Active">Super Active (Very hard exercise, physical job)</option>
                                </Form.Select>
                            </div>
                            <div className="text-center">
                                <Button 
                                    className="diet-submit-btn" 
                                    type="submit" 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                            Generating Your Plan...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-magic me-2"></i>
                                            Generate My Action Plan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                        {error && (
                            <Alert className="diet-error-alert">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                {error}
                            </Alert>
                        )}
                    </div>
                </Card>

                {result && (
                    <Card className="diet-results-card">
                        <div className="diet-results-header">
                            <i className="bi bi-clipboard-check display-4 mb-3"></i>
                            <h3 className="mb-0">Your Personalized Health & Action Plan</h3>
                        </div>
                        <div className="diet-results-body">
                            <div className="bmi-bmr-section">
                                <Row>
                                    <Col md={6} className="mb-3 mb-md-0">
                                        <div className="metric-card">
                                            <h4 className="metric-title">
                                                <i className="bi bi-speedometer2 me-2"></i>
                                                Your BMI
                                            </h4>
                                            <div className="metric-value">{result.bmi}</div>
                                            <p className="metric-category">({result.bmi_category})</p>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="metric-card">
                                            <h4 className="metric-title">
                                                <i className="bi bi-fire me-2"></i>
                                                Your BMR
                                            </h4>
                                            <div className="metric-value">{result.bmr}</div>
                                            <p className="metric-category">(Calories/day at rest)</p>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                            
                            <div className="plan-section">
                                <Row>
                                    <Col lg={6} className="mb-4">
                                        <div className="plan-card">
                                            <div className="plan-header-diet">
                                                <i className="bi bi-egg-fried me-2"></i>
                                                Personalized Diet Plan
                                            </div>
                                            <div className="plan-content">
                                                <ReactMarkdown>{result.diet_plan}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col lg={6} className="mb-4">
                                        <div className="plan-card">
                                            <div className="plan-header-workout">
                                                <i className="bi bi-heart-pulse me-2"></i>
                                                Workout Recommendations
                                            </div>
                                            <div className="plan-content">
                                                <ReactMarkdown>{result.workout_plan}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                            
                            <Alert className="diet-disclaimer">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                <strong>Medical Disclaimer:</strong> This is an AI-generated estimate based on general guidelines. Please consult a healthcare professional or registered dietitian for personalized medical advice and before making significant changes to your diet or exercise routine.
                            </Alert>
                        </div>
                    </Card>
                )}
            </Container>
        </div>
    );
};

export default DietPlannerPage;

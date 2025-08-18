import React, { useState } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';

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
        <>
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Card.Title as="h2" className="text-center mb-4">Personalized Diet & Workout Planner</Card.Title>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Your Age</Form.Label>
                                    <Form.Control type="number" name="age" value={formData.age} onChange={handleInputChange} required min="18" />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Your Gender</Form.Label>
                                    <Form.Select name="gender" value={formData.gender} onChange={handleInputChange}>
                                        <option>Male</option>
                                        <option>Female</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Weight (in kg)</Form.Label>
                                    <Form.Control type="number" name="weight" value={formData.weight} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Height (in cm)</Form.Label>
                                    <Form.Control type="number" name="height" value={formData.height} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-4">
                            <Form.Label>Daily Activity Level</Form.Label>
                            <Form.Select name="activity_level" value={formData.activity_level} onChange={handleInputChange}>
                                <option>Sedentary</option>
                                <option>Lightly Active</option>
                                <option>Moderately Active</option>
                                <option>Very Active</option>
                                <option>Super Active</option>
                            </Form.Select>
                        </Form.Group>
                        <div className="text-center">
                            <Button variant="primary" type="submit" size="lg" disabled={loading}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Generate My Action Plan'}
                            </Button>
                        </div>
                    </Form>
                    {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
                </Card.Body>
            </Card>

            {result && (
                <Card className="mt-4 shadow-lg">
                    <Card.Header as="h3" className="text-center bg-light">Your Health Report & Action Plan</Card.Header>
                    <Card.Body>
                        <Row className="text-center mb-4">
                            <Col>
                                <h4>Your BMI</h4>
                                <h2 className="text-primary">{result.bmi}</h2>
                                <p><strong>({result.bmi_category})</strong></p>
                            </Col>
                            <Col>
                                <h4>Your BMR</h4>
                                <h2 className="text-success">{result.bmr}</h2>
                                <p><strong>(Calories/day at rest)</strong></p>
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col md={6}>
                                <h4 className="mb-3">🌱 Personalized Diet Plan</h4>
                                <div className="p-3 bg-light rounded">
                                    <ReactMarkdown>{result.diet_plan}</ReactMarkdown>
                                </div>
                            </Col>
                            <Col md={6}>
                                <h4 className="mb-3">💪 Workout Recommendations</h4>
                                <div className="p-3 bg-light rounded">
                                    <ReactMarkdown>{result.workout_plan}</ReactMarkdown>
                                </div>
                            </Col>
                        </Row>
                        <Alert variant="info" className="mt-4">
                            <strong>Disclaimer:</strong> This is an estimate. Consult a healthcare professional for personalized advice.
                        </Alert>
                    </Card.Body>
                </Card>
            )}
        </>
    );
};

export default DietPlannerPage;
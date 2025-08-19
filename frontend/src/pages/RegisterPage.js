import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import './RegisterPage.css'; // Import CSS file

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        return strength;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (formData.password !== formData.password2) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/register/', formData);
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                const firstErrorKey = Object.keys(errorData)[0];
                setError(`${firstErrorKey}: ${errorData[firstErrorKey]}`);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength < 50) return 'danger';
        if (passwordStrength < 75) return 'warning';
        return 'success';
    };

    const getStrengthText = () => {
        if (passwordStrength < 25) return 'Very Weak';
        if (passwordStrength < 50) return 'Weak';
        if (passwordStrength < 75) return 'Good';
        return 'Strong';
    };

    return (
        <div className="register-container d-flex align-items-center py-5">
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                        <Card className="register-card overflow-hidden">
                            <div className="register-header text-center py-4">
                                <i className="bi bi-person-plus-fill display-4 mb-2"></i>
                                <h2 className="mb-0 fw-bold">Create Account</h2>
                                <p className="mb-0 opacity-75">Join Aarogya Buddy today</p>
                            </div>
                            
                            <Card.Body className="p-4 p-md-5">
                                {error && (
                                    <Alert variant="danger" className="border-0 rounded-3 mb-4">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {error}
                                    </Alert>
                                )}
                                
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold text-dark mb-2">
                                            <i className="bi bi-person me-2 text-muted"></i>
                                            Username
                                        </Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="username"
                                            required 
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="form-control-custom"
                                            placeholder="Choose a username"
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold text-dark mb-2">
                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                            Email Address
                                        </Form.Label>
                                        <Form.Control 
                                            type="email" 
                                            name="email"
                                            required 
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="form-control-custom"
                                            placeholder="Enter your email"
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold text-dark mb-2">
                                            <i className="bi bi-lock me-2 text-muted"></i>
                                            Password
                                        </Form.Label>
                                        <Form.Control 
                                            type="password" 
                                            name="password"
                                            required 
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="form-control-custom"
                                            placeholder="Create a strong password"
                                        />
                                        {formData.password && (
                                            <div className="mt-2">
                                                <ProgressBar 
                                                    variant={getStrengthColor()} 
                                                    now={passwordStrength} 
                                                    className="password-strength-progress mb-1"
                                                />
                                                <small className={`text-${getStrengthColor()}`}>
                                                    Password Strength: {getStrengthText()}
                                                </small>
                                            </div>
                                        )}
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold text-dark mb-2">
                                            <i className="bi bi-lock-fill me-2 text-muted"></i>
                                            Confirm Password
                                        </Form.Label>
                                        <Form.Control 
                                            type="password" 
                                            name="password2"
                                            required 
                                            value={formData.password2}
                                            onChange={handleInputChange}
                                            className={`form-control-custom ${
                                                formData.password2 && formData.password !== formData.password2 ? 'password-match-error' : ''
                                            }`}
                                            placeholder="Confirm your password"
                                        />
                                        {formData.password2 && formData.password !== formData.password2 && (
                                            <small className="text-danger">
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                Passwords do not match
                                            </small>
                                        )}
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-4">
                                        <Form.Check 
                                            type="checkbox" 
                                            required
                                            label={
                                                <span className="small text-muted">
                                                    I agree to the Terms of Service and Privacy Policy
                                                </span>
                                            }
                                        />
                                    </Form.Group>
                                    
                                    <Button 
                                        type="submit" 
                                        className="btn-login w-100 text-white"
                                        disabled={isLoading || formData.password !== formData.password2}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                Creating Account...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-plus me-2"></i>
                                                Create Account
                                            </>
                                        )}
                                    </Button>
                                </Form>
                                
                                <hr className="my-4" />
                                
                                <div className="text-center">
                                    <span className="text-muted">Already have an account? </span>
                                    <Link to="/login" className="login-redirect-link text-decoration-none">
                                        Sign In
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default RegisterPage;

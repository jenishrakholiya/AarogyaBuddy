import React, { useContext, useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './LoginPage.css'; // Import CSS file

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await loginUser(email, password);
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container d-flex align-items-center py-5">
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                        <Card className="login-card overflow-hidden">
                            <div className="login-header text-center py-4">
                                <i className="bi bi-shield-fill-check display-4 mb-2"></i>
                                <h2 className="mb-0 fw-bold">Welcome Back</h2>
                                <p className="mb-0 opacity-75">Sign in to your Aarogya Buddy account</p>
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
                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                            Email Address
                                        </Form.Label>
                                        <Form.Control 
                                            type="email" 
                                            required 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="form-control-custom"
                                            placeholder="Enter your email"
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold text-dark mb-2">
                                            <i className="bi bi-lock me-2 text-muted"></i>
                                            Password
                                        </Form.Label>
                                        <Form.Control 
                                            type="password" 
                                            required 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="form-control-custom"
                                            placeholder="Enter your password"
                                        />
                                    </Form.Group>
                                    
                                    
                                    
                                    <Button 
                                        type="submit" 
                                        className="btn-login w-100 text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                Signing In...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                Sign In
                                            </>
                                        )}
                                    </Button>
                                </Form>
                                
                                <hr className="my-4" />
                                
                                <div className="text-center">
                                    <span className="text-muted">Don't have an account? </span>
                                    <Link to="/register" className="register-link text-decoration-none">
                                        Create Account
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

export default LoginPage;

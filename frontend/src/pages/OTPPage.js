import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import './OTPPage.css'; // Import CSS file

const OTPPage = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    if (!email) {
        return (
            <Container className="py-5">
                <Alert className="otp-no-email-alert text-center">
                    <i className="bi bi-exclamation-triangle-fill display-4 mb-3"></i>
                    <h4>No Email Provided</h4>
                    <p>We couldn't find your email address. Please register first to continue.</p>
                    <Link to="/register" className="otp-register-link">
                        <i className="bi bi-arrow-left me-2"></i>
                        Go to Registration
                    </Link>
                </Alert>
            </Container>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsVerifying(true);

        try {
            const response = await api.post('/auth/verify-otp/', { email, otp });
            
            if (response.status === 200) {
                setSuccess('Account verified successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP or verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await api.post('/auth/resend-otp/', { email });
            setError('');
            // You might want to show a success message for resend
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        }
    };

    return (
        <div className="otp-container">
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                        <Card className="otp-card">
                            <div className="otp-header">
                                <i className="bi bi-shield-check otp-icon"></i>
                                <h2 className="otp-title">Verify Your Account</h2>
                                <p className="otp-subtitle">We've sent a 6-digit code to your email</p>
                            </div>
                            
                            <div className="otp-body">
                                <div className="otp-email-display">
                                    <i className="bi bi-envelope-fill me-2"></i>
                                    {email}
                                </div>

                                {error && (
                                    <Alert className="otp-error-alert mb-4">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {error}
                                    </Alert>
                                )}
                                
                                {success && (
                                    <Alert className="otp-success-alert mb-4">
                                        <i className="bi bi-check-circle-fill me-2 otp-success-icon"></i>
                                        {success}
                                    </Alert>
                                )}
                                
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="otp-label">
                                            <i className="bi bi-key-fill me-2"></i>
                                            Enter Verification Code
                                        </Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            maxLength="6" 
                                            required 
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="otp-input"
                                            placeholder="000000"
                                            disabled={success}
                                        />
                                        <Form.Text className="text-muted small mt-2">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Enter the 6-digit code sent to your email
                                        </Form.Text>
                                    </Form.Group>
                                    
                                    <Button 
                                        className="otp-btn w-100 text-white mb-3" 
                                        type="submit" 
                                        disabled={success || isVerifying || otp.length !== 6}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                Verifying...
                                            </>
                                        ) : success ? (
                                            <>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                Verified Successfully!
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-shield-check me-2"></i>
                                                Verify Account
                                            </>
                                        )}
                                    </Button>
                                </Form>

                                {!success && (
                                    <div className="text-center">
                                        <p className="text-muted small mb-2">Didn't receive the code?</p>
                                        <Button 
                                            variant="link" 
                                            onClick={handleResendOTP}
                                            className="p-0 text-decoration-none fw-semibold"
                                            style={{ color: '#2860a1' }}
                                        >
                                            <i className="bi bi-arrow-clockwise me-1"></i>
                                            Resend Code
                                        </Button>
                                    </div>
                                )}

                                <hr className="my-4" />
                                
                                <div className="text-center">
                                    <Link to="/login" className="text-decoration-none text-muted">
                                        <i className="bi bi-arrow-left me-2"></i>
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default OTPPage;

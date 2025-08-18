import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const OTPPage = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // State for success message
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    if (!email) {
        return <Alert variant="danger">No email provided. Please <a href="/register">register</a> first.</Alert>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/auth/verify-otp/', { email, otp });
            
            // --- THIS IS THE FIX ---
            // If the request succeeds (doesn't throw an error), we handle the success case.
            if (response.status === 200) {
                setSuccess('Account verified successfully! Redirecting to login...');
                // Redirect to the login page after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            // This block now only runs if the API call itself fails (e.g., 400 or 404)
            setError(err.response?.data?.error || 'Invalid OTP or verification failed. Please try again.');
        }
    };

    return (
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
            <Card.Body>
                <h2 className="text-center mb-4">Verify Your Account</h2>
                <p className="text-center">An OTP has been sent to {email}</p>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="otp">
                        <Form.Label>OTP Code</Form.Label>
                        <Form.Control 
                            type="text" 
                            maxLength="6" 
                            required 
                            onChange={(e) => setOtp(e.target.value)} 
                            placeholder="Enter 6-digit code"
                        />
                    </Form.Group>
                    <Button className="w-100 mt-3" type="submit" disabled={!!success}>
                        {success ? 'Verified!' : 'Verify Account'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default OTPPage;
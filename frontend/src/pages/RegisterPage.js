// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== password2) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await api.post('/auth/register/', { username, email, password, password2 });
            navigate('/verify-otp', { state: { email: email } });
        } catch (err) {
            if (err.response && err.response.data) {
                // Extract and display the first error message
                const errorData = err.response.data;
                const firstErrorKey = Object.keys(errorData)[0];
                setError(`${firstErrorKey}: ${errorData[firstErrorKey]}`);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
            <Card.Body>
                <h2 className="text-center mb-4">Register</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="username">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" required onChange={(e) => setUsername(e.target.value)} />
                    </Form.Group>
                    <Form.Group id="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" required onChange={(e) => setEmail(e.target.value)} />
                    </Form.Group>
                    <Form.Group id="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" required onChange={(e) => setPassword(e.target.value)} />
                    </Form.Group>
                    <Form.Group id="password2">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control type="password" required onChange={(e) => setPassword2(e.target.value)} />
                    </Form.Group>
                    <Button className="w-100 mt-3" type="submit">Register</Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default RegisterPage;
// frontend/src/pages/LoginPage.js
import React, { useContext, useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await loginUser(email, password);
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
        }
    };

    return (
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
            <Card.Body>
                <h2 className="text-center mb-4">Login</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" required onChange={(e) => setEmail(e.target.value)} />
                    </Form.Group>
                    <Form.Group id="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" required onChange={(e) => setPassword(e.target.value)} />
                    </Form.Group>
                    <Button className="w-100 mt-3" type="submit">Login</Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default LoginPage;
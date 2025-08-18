import React, { useState, useRef } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert, Image } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';

const ReportAnalysisPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setResult(null);
            setError('');
            
            // Updated preview logic for both images and PDFs
            if (file.type.startsWith('image/')) {
                // Preview for images
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                // Preview for PDFs using blob URL
                setPreview(URL.createObjectURL(file));
            } else {
                // For unsupported files, clear preview
                setPreview(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to analyze.');
            return;
        }
        
        setLoading(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('report_file', selectedFile);

        try {
            const response = await api.post('/reports/analyze/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data.analysis);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze the report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Card.Title as="h2" className="text-center mb-4">AI-Powered Report Analysis</Card.Title>
                    <Form onSubmit={handleSubmit}>
                        <Row className="align-items-center">
                            <Col md={6} className="text-center">
                                {preview ? (
                                    // Conditionally render image or PDF preview
                                    selectedFile.type === 'application/pdf' ? (
                                        <embed src={preview} type="application/pdf" width="100%" height="300px" />
                                    ) : (
                                        <Image src={preview} thumbnail fluid style={{ maxHeight: '300px' }} />
                                    )
                                ) : (
                                    <div className="p-5 bg-light rounded text-muted">
                                        {selectedFile ? `Selected file: ${selectedFile.name}` : 'Your report preview will appear here.'}
                                    </div>
                                )}
                            </Col>
                            <Col md={6}>
                                <p className="text-muted">
                                    Upload a clear image or PDF of your medical report. Our AI will extract the text and provide a simplified summary.
                                </p>
                                <Form.Group controlId="formFile" className="mb-3">
                                    <Form.Control 
                                        type="file" 
                                        accept="image/*,application/pdf" 
                                        onChange={handleFileChange} 
                                        ref={fileInputRef} 
                                    />
                                </Form.Group>
                                <div className="d-grid">
                                    <Button variant="primary" type="submit" size="lg" disabled={loading || !selectedFile}>
                                        {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Analyze Report'}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                    {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
                </Card.Body>
            </Card>

            {result && (
                <Card className="mt-4 shadow-lg">
                    <Card.Header as="h3" className="text-center bg-light">AI Analysis Result</Card.Header>
                    <Card.Body className="p-4">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </Card.Body>
                </Card>
            )}
        </>
    );
};

export default ReportAnalysisPage;

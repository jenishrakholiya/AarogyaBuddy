import React, { useState, useRef } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert, Image, Container } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';
import './ReportAnalysisPage.css'; // Import CSS file

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
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                setPreview(URL.createObjectURL(file));
            } else {
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
        <div className="report-analysis-container">
            <Container>
                <Card className="report-analysis-card">
                    <div className="report-analysis-header">
                        <i className="bi bi-file-earmark-medical display-4 mb-3"></i>
                        <h2 className="report-analysis-title">
                            Medical Report Analysis
                        </h2>
                        <p className="report-analysis-subtitle">
                            Upload your medical reports and get instant insights
                        </p>
                    </div>
                    
                    <div className="report-analysis-body">
                        <div className="upload-description">
                            <i className="bi bi-info-circle me-2"></i>
                            Upload a clear image or PDF of your medical report. Our Website will extract the text and provide a simplified summary with key insights.
                        </div>

                        <div className="upload-instructions">
                            <h5 className="instruction-title">
                                <i className="bi bi-list-check me-2"></i>
                                Upload Guidelines
                            </h5>
                            <ul className="instruction-list">
                                <li className="instruction-item">
                                    <i className="bi bi-check-circle instruction-icon"></i>
                                    Ensure text is clear and readable
                                </li>
                                <li className="instruction-item">
                                    <i className="bi bi-check-circle instruction-icon"></i>
                                    Supported formats: JPG, PNG, PDF
                                </li>
                                <li className="instruction-item">
                                    <i className="bi bi-check-circle instruction-icon"></i>
                                    Maximum file size: 10MB
                                </li>
                                <li className="instruction-item">
                                    <i className="bi bi-check-circle instruction-icon"></i>
                                    Keep personal information in mind
                                </li>
                            </ul>
                        </div>

                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col lg={6} className="mb-4">
                                    <div className="preview-container">
                                        {preview ? (
                                            selectedFile.type === 'application/pdf' ? (
                                                <embed 
                                                    src={preview} 
                                                    type="application/pdf" 
                                                    className="preview-pdf"
                                                />
                                            ) : (
                                                <Image 
                                                    src={preview} 
                                                    className="preview-image" 
                                                    fluid 
                                                />
                                            )
                                        ) : (
                                            <div className="preview-placeholder">
                                                <i className="bi bi-file-earmark-image preview-icon"></i>
                                                <p className="preview-text">
                                                    {selectedFile ? 
                                                        `Selected: ${selectedFile.name}` : 
                                                        'Your report preview will appear here'
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                                
                                <Col lg={6} className="mb-4">
                                    <div className="upload-section">
                                        <i className="bi bi-cloud-upload display-5 text-primary mb-3"></i>
                                        <h5 className="mb-3">Upload Your Medical Report</h5>
                                        
                                        <Form.Group className="file-input-group">
                                            <Form.Control 
                                                type="file" 
                                                accept="image/*,application/pdf" 
                                                onChange={handleFileChange} 
                                                ref={fileInputRef}
                                                className="file-input"
                                            />
                                        </Form.Group>
                                        
                                        <Button 
                                            className="analyze-btn" 
                                            type="submit" 
                                            disabled={loading || !selectedFile}
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                    Analyzing Report...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-cpu me-2"></i>
                                                    Analyze Report
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Form>
                        
                        {error && (
                            <Alert className="report-error-alert">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                {error}
                            </Alert>
                        )}
                    </div>
                </Card>

                {result && (
                    <Card className="analysis-results-card">
                        <div className="analysis-results-header">
                            <i className="bi bi-clipboard-data display-4 mb-3"></i>
                            <h3 className="mb-0">Analysis Results</h3>
                        </div>
                        <div className="analysis-results-body">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    </Card>
                )}
            </Container>
        </div>
    );
};

export default ReportAnalysisPage;

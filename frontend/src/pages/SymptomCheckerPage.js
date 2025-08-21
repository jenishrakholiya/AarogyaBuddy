import React, { useState, useMemo } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert, ListGroup, ProgressBar, Container } from 'react-bootstrap';
import api from '../api/axiosConfig';
import './SymptomCheckerPage.css'; // Import CSS file

// Define the missing constants and function at the top
const symptomGroups = {
    "General & Systemic": ['fever', 'fatigue', 'chills', 'body_ache', 'excessive_thirst'],
    "Head & Respiratory": ['headache', 'sore_throat', 'cough', 'shortness_of_breath', 'runny_nose', 'sneezing'],
    "Gastrointestinal": ['nausea', 'vomiting', 'diarrhea', 'abdominal_pain'],
    "Musculoskeletal & Skin": ['joint_pain', 'rash', 'back_pain'],
    "Neurological & Mental State": ['anxiety', 'insomnia', 'depression', 'blurred_vision'],
    "Urinary": ['frequent_urination', 'burning_sensation_urination']
};

const severityMap = { 'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3 };
const severityLabels = ['None', 'Mild', 'Moderate', 'Severe'];

const formatLabel = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const SymptomCheckerPage = () => {
    const [step, setStep] = useState(1);

    // useMemo ensures this complex initial state is only computed once.
    const initialFormData = useMemo(() => {
        const symptomKeys = Object.values(symptomGroups).flat();
        const initialSymptoms = symptomKeys.reduce((acc, symptom) => {
            acc[symptom] = 0; // Default all symptoms to 'None' (severity 0)
            return acc;
        }, {});

        return {
            age: '',
            gender: 'Male',
            duration: '1-3 days',
            ...initialSymptoms
        };
    }, []);

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const processedValue = name === 'age' ? parseInt(value, 10) || '' : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSeverityChange = (symptom, value) => {
        const numericValue = severityMap[value];
        setFormData(prev => ({ ...prev, [symptom]: numericValue }));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.age || formData.age < 1 || formData.age > 120) {
                setError("Please enter a valid age between 1 and 120.");
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (step < 2) {
                nextStep();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const allSymptoms = Object.values(symptomGroups).flat();
        const totalSeverity = allSymptoms.reduce((sum, key) => sum + formData[key], 0);
        if (totalSeverity === 0) {
            setError("Please rate at least one symptom as Mild, Moderate, or Severe.");
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        const payload = { ...formData };
        payload.primary_symptom_duration = payload.duration;
        delete payload.duration;

        try {
            const response = await api.post('/symptoms/check/', payload);
            setResult(response.data);
            setStep(3);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Could not get a prediction. Please try again later.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityClass = (severity) => {
        const severityClasses = {
            'None': 'severity-none',
            'Mild': 'severity-mild',
            'Moderate': 'severity-moderate',
            'Severe': 'severity-severe'
        };
        return severityClasses[severity] || '';
    };

    const renderSymptomRating = (symptom) => (
        <Row key={symptom} className="symptom-rating-row align-items-center">
            <Col sm={12} md={4} className="mb-2 mb-md-0">
                <div className="symptom-rating-label">
                    <i className="bi bi-chevron-right me-2 text-primary"></i>
                    {formatLabel(symptom)}
                </div>
            </Col>
            <Col sm={12} md={8}>
                <div className="symptom-radio-group">
                    {severityLabels.map(label => (
                        <div key={label} className={`symptom-radio-option ${getSeverityClass(label)}`}>
                            <input
                                type="radio"
                                id={`${symptom}_${label}`}
                                name={symptom}
                                checked={formData[symptom] === severityMap[label]}
                                onChange={() => handleSeverityChange(symptom, label)}
                            />
                            <label htmlFor={`${symptom}_${label}`}>
                                {label}
                            </label>
                        </div>
                    ))}
                </div>
            </Col>
        </Row>
    );

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h4 className={`step-header step-${step}`}>Basic Information</h4>
                        <Row>
                            <Col md={4} className="symptom-form-group">
                                <Form.Label className="symptom-form-label">
                                    <i className="bi bi-person me-2"></i>
                                    Your Age
                                </Form.Label>
                                <Form.Control 
                                    type="number" 
                                    name="age" 
                                    value={formData.age} 
                                    onChange={handleInputChange}
                                    className="symptom-form-control"
                                    placeholder="Enter your age"
                                    min="1" 
                                    max="120" 
                                    required 
                                />
                            </Col>
                            <Col md={4} className="symptom-form-group">
                                <Form.Label className="symptom-form-label">
                                    <i className="bi bi-gender-ambiguous me-2"></i>
                                    Your Gender
                                </Form.Label>
                                <Form.Select 
                                    name="gender" 
                                    value={formData.gender} 
                                    onChange={handleInputChange}
                                    className="symptom-form-select"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </Form.Select>
                            </Col>
                            <Col md={4} className="symptom-form-group">
                                <Form.Label className="symptom-form-label">
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Symptom Duration
                                </Form.Label>
                                <Form.Select 
                                    name="duration" 
                                    value={formData.duration} 
                                    onChange={handleInputChange}
                                    className="symptom-form-select"
                                >
                                    <option value="1-3 days">1-3 days</option>
                                    <option value="4-7 days">4-7 days</option>
                                    <option value="more than a week">More than a week</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </>
                );
            case 2:
                return (
                    <>
                        <h4 className={`step-header step-${step}`}>Rate Your Symptoms</h4>
                        <p className="text-muted mb-4 text-center">
                            <i className="bi bi-info-circle me-2"></i>
                            Please rate each symptom based on how severe you're experiencing it
                        </p>
                        {Object.entries(symptomGroups).map(([groupName, symptoms]) => (
                            <div key={groupName} className="symptom-group">
                                <h5 className="symptom-group-title">
                                    <i className="bi bi-clipboard-pulse me-2"></i>
                                    {groupName}
                                </h5>
                                {symptoms.map(symptom => renderSymptomRating(symptom))}
                            </div>
                        ))}
                    </>
                );
            default:
                return null;
        }
    };

    const renderTreatmentCard = (treatment, type) => (
        <Col md={6} className="mb-4">
            <Card className="treatment-card h-100">
                <div className={type === 'Allopathic' ? 'treatment-card-header-allopathic' : 'treatment-card-header-ayurvedic'}>
                    <i className={`bi ${type === 'Allopathic' ? 'bi-capsule' : 'bi-leaf'} me-2`}></i>
                    {type} Treatment
                </div>
                <ListGroup variant="flush">
                    <ListGroup.Item className="treatment-list-item">
                        <strong>Medicine:</strong> {treatment.medicine_name || 'N/A'}
                    </ListGroup.Item>
                    <ListGroup.Item className="treatment-list-item">
                        <strong>Frequency:</strong> {treatment.frequency || 'N/A'}
                    </ListGroup.Item>
                    <ListGroup.Item className="treatment-list-item">
                        <strong>Routine:</strong> {treatment.routine || 'N/A'}
                    </ListGroup.Item>
                    <ListGroup.Item className="treatment-list-item">
                        <strong>Side Effects:</strong> {treatment.side_effects || 'N/A'}
                    </ListGroup.Item>
                    <ListGroup.Item className="treatment-list-item">
                        <strong>Contraindications:</strong> {treatment.contraindications || 'N/A'}
                    </ListGroup.Item>
                </ListGroup>
            </Card>
        </Col>
    );

    if (result) {
        return (
            <div className="symptom-checker-container">
                <Container>
                    <Card className="results-card">
                        <div className="results-header">
                            <i className="bi bi-clipboard-check display-4 mb-3"></i>
                            <h3 className="mb-0">Your Health Analysis Report</h3>
                        </div>
                        <div className="results-body">
                            <div className="predicted-disease">
                                <h4>Most Likely Condition</h4>
                                <h2>{result.predicted_disease}</h2>
                                <p>Based on your symptoms, this is a possible condition. This is not a final diagnosis.</p>
                            </div>
                            
                            <h4 className="treatment-section-title">
                                <i className="bi bi-heart-pulse me-2"></i>
                                Informational Treatment Overview
                            </h4>
                            <Row>
                                {renderTreatmentCard(result.allopathic_treatment, 'Allopathic')}
                                {renderTreatmentCard(result.ayurvedic_treatment, 'Ayurvedic')}
                            </Row>
                            
                            <div className="text-center mt-4">
                                <Button 
                                    className="start-over-btn"
                                    onClick={() => { 
                                        setResult(null); 
                                        setFormData(initialFormData); 
                                        setStep(1); 
                                    }}
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    Start New Analysis
                                </Button>
                            </div>
                            
                            <Alert className="disclaimer-alert">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                <strong>Medical Disclaimer:</strong> This is an informational purposes only and does not substitute for professional medical advice. Please consult a qualified doctor for an accurate diagnosis and treatment plan.
                            </Alert>
                        </div>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <div className="symptom-checker-container">
            <Container>
                <Card className="symptom-checker-card">
                    <div className="symptom-checker-header">
                        <i className="bi bi-search-heart display-4 mb-3"></i>
                        <h2 className="symptom-checker-title"> Symptom Checker</h2>
                        <p className="symptom-checker-subtitle">Get personalized health insights based on your symptoms</p>
                    </div>
                    <div className="symptom-checker-body">
                        <ProgressBar 
                            now={(step / 2) * 100} 
                            label={`Step ${step} of 2`} 
                            className="symptom-progress-bar"
                        />
                        <Form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                            {renderStep()}
                            {error && (
                                <Alert className="symptom-error-alert mt-4">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error}
                                </Alert>
                            )}
                            <div className="symptom-nav-buttons">
                                {step > 1 && (
                                    <Button 
                                        type="button" 
                                        className="symptom-btn-secondary"
                                        onClick={prevStep}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>
                                        Previous Step
                                    </Button>
                                )}
                                <div style={{ flex: 1 }}></div>
                                {step < 2 && (
                                    <Button 
                                        type="button" 
                                        className="symptom-btn-primary"
                                        onClick={nextStep}
                                    >
                                        Next Step
                                        <i className="bi bi-arrow-right ms-2"></i>
                                    </Button>
                                )}
                                {step === 2 && (
                                    <Button 
                                        className="symptom-btn-success" 
                                        type="submit" 
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner 
                                                    as="span" 
                                                    animation="border" 
                                                    size="sm" 
                                                    className="symptom-spinner me-2" 
                                                />
                                                Analyzing Symptoms...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-magic me-2"></i>
                                                Get My Health Report
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </Form>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default SymptomCheckerPage;

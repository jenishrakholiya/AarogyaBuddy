import React, { useState, useMemo } from 'react';
import { Form, Button, Card, Col, Row, Spinner, Alert, ListGroup, ProgressBar } from 'react-bootstrap';
import api from '../api/axiosConfig';  // Uncommented real API import (remove mock in production)

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
        // CORRECTED: Ensure 'age' is stored as a number, not a string,
        // as the model expects a numerical input.
        const processedValue = name === 'age' ? parseInt(value, 10) || '' : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSeverityChange = (symptom, value) => {
        const numericValue = severityMap[value];
        setFormData(prev => ({ ...prev, [symptom]: numericValue }));
    };

    const nextStep = () => {
        if (step === 1) {
            // Basic validation for the first step.
            if (!formData.age || formData.age < 1 || formData.age > 120) {
                setError("Please enter a valid age between 1 and 120.");
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);
    
    // Allows pressing Enter to move to the next step in the form (attached to Form now).
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
        
        // Ensure the user has selected at least one symptom.
        const allSymptoms = Object.values(symptomGroups).flat();
        const totalSeverity = allSymptoms.reduce((sum, key) => sum + formData[key], 0);
        if (totalSeverity === 0) {
            setError("Please rate at least one symptom as Mild, Moderate, or Severe.");
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        // Prepare the payload for the API.
        const payload = { ...formData };
        // Rename 'duration' to 'primary_symptom_duration' to match the backend.
        payload.primary_symptom_duration = payload.duration;
        delete payload.duration;

        try {
            const response = await api.post('/symptoms/check/', payload);
            setResult(response.data);
            setStep(3); // Move to the result view
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Could not get a prediction. Please try again later.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---

    const renderSymptomRating = (symptom) => (
        <Form.Group as={Row} key={symptom} className="mb-3 align-items-center">
            <Form.Label column sm={4} md={3}>{formatLabel(symptom)}</Form.Label>
            <Col sm={8} md={9}>
                {severityLabels.map(label => (
                    <Form.Check
                        inline
                        key={label}
                        type="radio"
                        name={symptom}
                        label={label}
                        checked={formData[symptom] === severityMap[label]}
                        onChange={() => handleSeverityChange(symptom, label)}
                    />
                ))}
            </Col>
        </Form.Group>
    );

    const renderStep = () => {
        switch (step) {
            case 1: // Basic Info
                return (
                    <>
                        <h4 className="mb-4">Step 1: Basic Information</h4>
                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Your Age</Form.Label>
                                    <Form.Control type="number" name="age" value={formData.age} onChange={handleInputChange} min="1" max="120" required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Your Gender</Form.Label>
                                    <Form.Select name="gender" value={formData.gender} onChange={handleInputChange}>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>  // Restored "Other" as per model support
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Symptom Duration</Form.Label>
                                    <Form.Select name="duration" value={formData.duration} onChange={handleInputChange}>
                                        <option>1-3 days</option>
                                        <option>4-7 days</option>
                                        <option>more than a week</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                );
            case 2: // All Symptoms
                return (
                    <>
                        <h4 className="mb-4">Step 2: Rate Your Symptoms</h4>
                        {Object.entries(symptomGroups).map(([groupName, symptoms]) => (
                            <div key={groupName} className="mb-4">
                                <h5>{groupName}</h5>
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
            <Card className="h-100 shadow-sm">
                <Card.Header as="h5" className={type === 'Allopathic' ? 'bg-info text-white' : 'bg-success text-white'}>
                    {type} Treatment
                </Card.Header>
                <ListGroup variant="flush">
                    <ListGroup.Item><strong>Medicine:</strong> {treatment.medicine_name || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item><strong>Frequency:</strong> {treatment.frequency || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item><strong>Routine:</strong> {treatment.routine || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item><strong>Side Effects:</strong> {treatment.side_effects || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item><strong>Contraindications:</strong> {treatment.contraindications || 'N/A'}</ListGroup.Item>
                </ListGroup>
            </Card>
        </Col>
    );

    if (result) {
        return (
            <Card className="mt-4 shadow-lg">
                <Card.Header as="h3" className="text-center bg-light">Health Report</Card.Header>
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <h4>Most Likely Condition</h4>
                        <h2 className="text-primary">{result.predicted_disease}</h2>
                        <p className="text-muted">Based on your symptoms, this is a possible condition. This is not a final diagnosis.</p>
                    </div>
                    <hr />
                    <h4 className="text-center my-4">Informational Treatment Overview</h4>
                    <Row>
                        {renderTreatmentCard(result.allopathic_treatment, 'Allopathic')}
                        {renderTreatmentCard(result.ayurvedic_treatment, 'Ayurvedic')}
                    </Row>
                    <div className="text-center mt-3">
                        <Button variant="secondary" onClick={() => { setResult(null); setFormData(initialFormData); setStep(1); }}>Start Over</Button>
                    </div>
                    <Alert variant="warning" className="mt-4">
                        <strong>Disclaimer:</strong> This is an AI-generated prediction for informational purposes only and does not substitute for professional medical advice. Please consult a qualified doctor for an accurate diagnosis and treatment plan.
                    </Alert>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <Card.Body className="p-4">
                <Card.Title as="h2" className="text-center mb-4">Symptom Checker</Card.Title>
                <ProgressBar now={(step / 2) * 100} label={`Step ${step} of 2`} className="mb-4" />
                <Form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>  // Attached keydown to Form for better Enter handling
                    {renderStep()}
                    {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
                    <div className="d-flex justify-content-between mt-4">
                        {step > 1 && <Button type="button" variant="secondary" onClick={prevStep}>Previous</Button>}
                        {step < 2 && <Button type="button" variant="primary" onClick={nextStep}>Next</Button>}
                        {step === 2 && 
                            <Button variant="success" type="submit" size="lg" disabled={loading}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Get My Health Report'}
                            </Button>
                        }
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default SymptomCheckerPage;

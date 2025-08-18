import React, { useState, useEffect } from 'react';
import { Form, Card, ListGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import api from '../api/axiosConfig';

const MedicineSearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchedTerm, setSearchedTerm] = useState(''); // To track what was searched

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setResults([]);
            setSearchedTerm('');
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            setError('');
            setSearchedTerm(searchTerm); // Set the term that is being searched

            api.get(`/medicines/search/?search=${searchTerm}`)
                .then(response => {
                    setResults(response.data);
                })
                .catch(err => {
                    console.error("Search failed:", err);
                    setError('Failed to fetch medicine data. Please try again later.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }, 800); // Increased debounce time for network requests

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Helper to render each medicine card
    const renderMedicine = (med) => {
        // Check if the result is from the database or scraped
        const isScraped = med.source && med.source.includes('Scraped');
        
        return (
            <ListGroup.Item key={med.medicine_name} className="mb-3">
                <h5>
                    {med.medicine_name}
                    {isScraped ? (
                        <Badge bg="warning" text="dark" className="ms-2">Live Result</Badge>
                    ) : (
                        <Badge bg="success" className="ms-2">{med.medicine_type}</Badge>
                    )}
                </h5>
                
                {isScraped && <p><strong>Source:</strong> {med.source}</p>}
                {med.price && <p><strong>Price:</strong> {med.price}</p>}
                
                <p><strong>Information:</strong> {med.treats_disease}</p>
                <p><strong>Frequency:</strong> {med.frequency}</p>
                <p><strong>Meal Relation:</strong> {med.meal_relation}</p>
                
                {med.side_effects && <p><strong>Side Effects:</strong> {med.side_effects}</p>}
                {med.contraindications && <p><strong>Contraindications:</strong> {med.contraindications}</p>}
                {med.routine && <p><strong>Routine:</strong> {med.routine}</p>}
            </ListGroup.Item>
        );
    };

    return (
        <Card border="light" className="shadow-sm">
            <Card.Header as="h4" className="bg-primary text-white">Medicine Information</Card.Header>
            <Card.Body>
                <Card.Title>Search for a Medicine</Card.Title>
                <p className="text-muted">
                    Search our database first. If not found, we'll search online for you.
                </p>
                <Form>
                    <Form.Group controlId="medicineSearch">
                        <Form.Control
                            type="text"
                            placeholder="Enter medicine name (e.g., Aspirin, Paracetamol)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            size="lg"
                        />
                    </Form.Group>
                </Form>

                <div className="mt-4">
                    {loading && <div className="text-center"><Spinner animation="border" variant="primary" /> <span className="ms-2">Searching...</span></div>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    {!loading && searchedTerm && results.length === 0 && (
                        <Alert variant="info">No results found for "{searchedTerm}".</Alert>
                    )}

                    {results.length > 0 && (
                        <ListGroup variant="flush">
                            {results.map(renderMedicine)}
                        </ListGroup>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default MedicineSearchPage;

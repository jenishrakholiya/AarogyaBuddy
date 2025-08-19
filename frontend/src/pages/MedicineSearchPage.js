import React, { useState, useEffect } from 'react';
import { Form, Card, Spinner, Alert, Container, Badge } from 'react-bootstrap';
import api from '../api/axiosConfig';
import './MedicineSearchPage.css';

const MedicineSearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchedTerm, setSearchedTerm] = useState('');
    const [searchTime, setSearchTime] = useState(0);
    const [loaderType, setLoaderType] = useState('pill');

    const suggestions = [
        'Paracetamol', 'Aspirin', 'Ibuprofen', 'Amoxicillin', 
        'Omeprazole', 'Cetirizine', 'Metformin', 'Atorvastatin'
    ];

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setResults([]);
            setSearchedTerm('');
            setError('');
            return;
        }

        const startTime = Date.now();
        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            setError('');
            setSearchedTerm(searchTerm);

            api.get(`/medicines/search/?search=${searchTerm}`)
                .then(response => {
                    setResults(response.data);
                    setSearchTime(Date.now() - startTime);
                })
                .catch(err => {
                    console.error("Search failed:", err);
                    setError('Failed to fetch medicine data. Please try again later.');
                    setSearchTime(Date.now() - startTime);
                })
                .finally(() => {
                    setLoading(false);
                });
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion);
    };

    const renderMedicineInfo = (label, value) => {
    if (!value || value === 'N/A') return null;
    
    return (
        <div className="medicine-info-row">
            <div className="info-label">{label}:</div>
            <div className="info-value">{value}</div>
        </div>
    );
};

const renderPriceInfo = (price) => {
    if (!price || price === 'N/A') return null;
    
    return (
        <div className="medicine-info-row">
            <div className="info-label">Price:</div>
            <div className="info-value">
                <span className="price-highlight">{price}</span>
            </div>
        </div>
    );
};

const renderSourceInfo = (source) => {
    if (!source || source === 'N/A') return null;
    
    return (
        <div className="medicine-info-row">
            <div className="info-label">Source:</div>
            <div className="info-value">
                {source.includes('http') ? (
                    <a href={source} target="_blank" rel="noopener noreferrer" className="source-link">
                        View Online Source
                    </a>
                ) : (
                    source
                )}
            </div>
        </div>
    );
};

const renderMedicine = (med, index) => {
    const isScraped = med.source && med.source.includes('Scraped');
    
    return (
        <div key={`${med.medicine_name}_${index}`} className="medicine-card">
            <div className="medicine-card-header">
                <h5 className="medicine-name">{med.medicine_name}</h5>
                <div className="medicine-badges">
                    {isScraped ? (
                        <Badge className="medicine-badge badge-live">Live Result</Badge>
                    ) : (
                        <Badge className="medicine-badge badge-database">Database</Badge>
                    )}
                    {med.medicine_type && (
                        <Badge className="medicine-badge badge-type">{med.medicine_type}</Badge>
                    )}
                </div>
            </div>
            
            <div className="medicine-card-body">
                {renderPriceInfo(med.price)}
                {renderSourceInfo(med.source)}
                {renderMedicineInfo('Information', med.treats_disease)}
                {renderMedicineInfo('Frequency', med.frequency)}
                {renderMedicineInfo('Meal Relation', med.meal_relation)}
                {renderMedicineInfo('Side Effects', med.side_effects)}
                {renderMedicineInfo('Contraindications', med.contraindications)}
                {renderMedicineInfo('Routine', med.routine)}
            </div>
        </div>
    );
};

    return (
        <div className="medicine-search-container">
            <Container>
                <Card className="medicine-search-card">
                    <div className="medicine-search-header">
                        <h2 className="medicine-search-title">
                            <i className="bi bi-search me-2"></i>
                            Medicine Information
                        </h2>
                        <p className="medicine-search-subtitle">
                            Search our database and get real-time medicine information
                        </p>
                    </div>
                    
                    <div className="medicine-search-body">
                        <h4 className="search-section-title">Search for a Medicine</h4>
                        
                        <div className="search-description">
                            <i className="bi bi-info-circle me-2"></i>
                            Search our database first. If not found, we'll search online for you.
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Enter medicine name (e.g., Aspirin, Paracetamol)"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-input"
                                size="lg"
                            />
                        </Form.Group>

                        {!searchTerm && (
                            <div className="search-suggestions">
                                <div className="suggestion-title">Popular Searches:</div>
                                <div className="suggestion-list">
                                    {suggestions.map(suggestion => (
                                        <span 
                                            key={suggestion}
                                            className="suggestion-tag"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            {loading && (
                                <div className="loading-container">
                                    <Spinner animation="border" variant="primary" />
                                    <div className="loading-text">Searching...</div>
                                </div>
                            )}

                            {error && (
                                <Alert className="medicine-error-alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error}
                                </Alert>
                            )}
                            
                            {!loading && searchedTerm && results.length === 0 && !error && (
                                <div className="no-results-container">
                                    <i className="bi bi-search no-results-icon"></i>
                                    <h5 className="no-results-title">No results found</h5>
                                    <p className="no-results-text">
                                        No results found for "{searchedTerm}". Try a different medicine name.
                                    </p>
                                </div>
                            )}

                            {results.length > 0 && (
                                <>
                                    <div className="search-stats">
                                        <div className="search-results-count">
                                            <i className="bi bi-check-circle me-2 text-success"></i>
                                            Found {results.length} result{results.length !== 1 ? 's' : ''} for "{searchedTerm}"
                                        </div>
                                        {searchTime > 0 && (
                                            <div className="search-time">
                                                Search completed in {(searchTime / 1000).toFixed(2)}s
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        {results.map((medicine, index) => renderMedicine(medicine, index))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default MedicineSearchPage;

import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Header.css'; // Import CSS file

const Header = () => {
    const { user, logoutUser } = useContext(AuthContext);

    return (
        <Navbar expand="lg" className="shadow-lg custom-navbar sticky-top">
            <Container fluid className="px-3 px-md-4">
                <Navbar.Brand 
                    as={Link} 
                    to="/" 
                    className="navbar-brand-custom text-white d-flex align-items-center"
                >
                    <i className="bi bi-heart-pulse-fill me-2 text-warning"></i>
                    Aarogya Buddy   
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="navbar-nav" className="border-0" />
                
                <Navbar.Collapse id="navbar-nav">
                    <Nav className="me-auto ms-lg-4">
                        {user && (
                            <>
                                <Nav.Link as={Link} to="/" className="nav-link-custom text-white px-3 py-2">
                                    <i className="bi bi-speedometer2 me-1"></i>Dashboard
                                </Nav.Link>
                                <Nav.Link as={Link} to="/symptom-checker" className="nav-link-custom text-white px-3 py-2">
                                    <i className="bi bi-search-heart me-1"></i>Symptom Checker
                                </Nav.Link>
                                <Nav.Link as={Link} to="/medicine-info" className="nav-link-custom text-white px-3 py-2">
                                    <i className="bi bi-capsule me-1"></i>Medicine Info
                                </Nav.Link>
                                <Nav.Link as={Link} to="/diet-planner" className="nav-link-custom text-white px-3 py-2">
                                    <i className="bi bi-apple me-1"></i>Diet Planner
                                </Nav.Link>
                                <Nav.Link as={Link} to="/report-analysis" className="nav-link-custom text-white px-3 py-2">
                                    <i className="bi bi-file-earmark-medical me-1"></i>Reports
                                </Nav.Link>
                            </>
                        )}
                    </Nav>
                    
                    <Nav className="ms-auto">
                        {user ? (
                            <NavDropdown 
                                title={
                                    <span className="text-white d-flex align-items-center">
                                        <i className="bi bi-person-circle me-2"></i>
                                        <span className="d-none d-md-inline me-1">Welcome,</span>
                                        <Badge className="user-badge">{user?.username || user?.email || 'User'}</Badge>
                                    </span>
                                } 
                                id="user-dropdown"
                                className="dropdown-custom"
                                align="end"
                            >
                                <NavDropdown.Item as={Link} to="/profile" className="py-2">
                                    <i className="bi bi-person-gear me-2 text-primary"></i>My Profile
                                </NavDropdown.Item>
                                <NavDropdown.Item onClick={logoutUser} className="py-2 text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <div className="d-flex gap-2">
                                <Button as={Link} to="/login" variant="outline-light" size="sm" className="px-3 rounded-pill">
                                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
                                </Button>
                                <Button as={Link} to="/register" variant="light" size="sm" className="px-3 rounded-pill text-primary fw-semibold">
                                    <i className="bi bi-person-plus me-1"></i>Register
                                </Button>
                            </div>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;

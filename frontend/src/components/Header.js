import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap'; // <-- IMPORT NavDropdown
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Header = () => {
    const { user, logoutUser } = useContext(AuthContext);

    return (
        <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
            <Container>
                <Navbar.Brand as={Link} to="/" style={{fontWeight: 'bold'}}>Aarogya Buddy</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {user && <Nav.Link as={Link} to="/">Dashboard</Nav.Link>}
                        {user && <Nav.Link as={Link} to="/symptom-checker">Symptom Checker</Nav.Link>}
                        {user && <Nav.Link as={Link} to="/medicine-info">Medicine Info</Nav.Link>}
                        {user && <Nav.Link as={Link} to="/diet-planner">Diet Planner</Nav.Link>}
                        {user && <Nav.Link as={Link} to="/report-analysis">Report Analysis</Nav.Link>}
                    </Nav>
                    <Nav>
                        {user ? (
                            <NavDropdown title={`Welcome, ${user?.username || user?.email || 'User'}`} id="basic-nav-dropdown">
                                <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={logoutUser}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register">Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;
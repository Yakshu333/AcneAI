import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../login_system/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <span className="brand-icon">🔬</span>
                <span className="brand-text">Acne<span className="brand-highlight">AI</span></span>
            </Link>

            <div className="navbar-links">
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
                <Link to="/analyze" className={`nav-link ${isActive('/analyze') ? 'active' : ''}`}>Analyze</Link>
                <Link to="/info" className={`nav-link ${isActive('/info') ? 'active' : ''}`}>Info</Link>
                {user && <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>History</Link>}
            </div>

            {user ? (
                <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
            ) : (
                <button onClick={() => navigate('/login')} className="nav-logout-btn">Login</button>
            )}
        </nav>
    );
};

export default Navbar;

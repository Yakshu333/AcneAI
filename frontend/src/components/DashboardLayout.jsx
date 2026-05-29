import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../login_system/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Analyze', path: '/analyze', icon: '🔍' },
    { name: 'History', path: '/history', icon: '📊', protected: true },
    { name: 'Acne Wiki', path: '/info', icon: '📖' },
  ];

  return (
    <div className="analyze-dashboard">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <span className="brand-logo">🔬 AcneAI</span>
        </div>
        <div className="mobile-profile-action">
          {user ? (
            <div className="mobile-avatar" onClick={handleLogout} title="Click to Logout">
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <button className="mobile-login-icon" onClick={() => navigate('/login')} title="Login">
              🔑
            </button>
          )}
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">🔬 AcneAI</span>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => {
            if (item.protected && !user) return null;
            const active = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-name">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">
            {user ? user.name.charAt(0).toUpperCase() : 'Y'}
          </div>
          <div className="profile-info-row">
            <div className="profile-info">
              <span className="profile-name">{user ? user.name : 'Yakshu'}</span>
              <span className="profile-status">
                <span className="status-dot"></span> Online
              </span>
            </div>
            {user ? (
              <button onClick={handleLogout} className="sidebar-logout-btn" title="Logout">
                🚪
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="sidebar-login-btn" title="Login">
                🔑
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="main-content-wrapper">
        <div className="dashboard-content">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="mobile-bottom-nav">
        {sidebarItems.map(item => {
          if (item.protected && !user) return null;
          const active = location.pathname === item.path;
          return (
            <Link key={item.name} to={item.path} className={`mobile-nav-link ${active ? 'active' : ''}`}>
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;

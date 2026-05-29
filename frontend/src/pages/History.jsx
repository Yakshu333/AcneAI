import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../login_system/AuthContext';

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8000/history?userId=${user.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch history');
                }
                const data = await response.json();
                setHistory(data.history || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    return (
        <DashboardLayout>
            <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'left', marginBottom: '2rem', fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>
                    Your Analysis History
                </h1>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: '600' }}>
                        Loading your history...
                    </div>
                ) : error ? (
                    <div style={{ color: '#ff4d4f', textAlign: 'center', padding: '3rem', fontWeight: '600' }}>
                        Error: {error}
                    </div>
                ) : history.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        background: '#ffffff', 
                        padding: '4rem 2rem', 
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: '500', margin: 0 }}>
                            You haven't analyzed any photos yet.
                        </p>
                        <Link 
                            to="/analyze" 
                            style={{ 
                                display: 'inline-block', 
                                marginTop: '1.5rem', 
                                textDecoration: 'none',
                                background: '#FF6B35',
                                color: '#ffffff',
                                padding: '0.75rem 2rem',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#e55a25'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#FF6B35'}
                        >
                            Start Analysis
                        </Link>
                    </div>
                ) : (
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {history.map((item) => (
                            <div key={item._id} className="history-card" style={{ 
                                background: '#ffffff', 
                                padding: '1.75rem', 
                                borderRadius: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#FF6B35', fontSize: '1.2rem', fontWeight: '700' }}>
                                        {item.prediction}
                                    </h3>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                        📅 Date: {item.date}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>
                                        {(item.confidence * 100).toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Confidence
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default History;

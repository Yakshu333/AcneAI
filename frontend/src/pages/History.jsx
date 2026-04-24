import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
                const response = await fetch(`http://127.0.0.1:5000/history?userId=${user.id}`);
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
        <div className="app-layout">
            <Navbar />
            <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Your Analysis History</h1>
                
                {loading ? (
                    <div style={{ textAlign: 'center' }}>Loading your history...</div>
                ) : error ? (
                    <div style={{ color: '#ff4d4f', textAlign: 'center' }}>Error: {error}</div>
                ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '15px' }}>
                        <p>You haven't analyzed any photos yet.</p>
                        <Link to="/analyze" className="analyze-btn" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                            Start Analysis
                        </Link>
                    </div>
                ) : (
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.map((item) => (
                            <div key={item._id} className="history-card" style={{ 
                                background: 'rgba(255,255,255,0.08)', 
                                padding: '1.5rem', 
                                borderRadius: '15px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#646cff' }}>{item.prediction}</h3>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Date: {item.date}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(item.confidence * 100).toFixed(2)}%</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Confidence</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" className="back-link">Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default History;

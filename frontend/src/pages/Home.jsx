import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../login_system/AuthContext';
import Navbar from '../components/Navbar';
import { OLD_ACNE_DATA } from '../constants/acneData';
import heroBg from '../hero-bg.jpeg';

const acneTypes = [
    { name: "Blackheads", emoji: "⚫" },
    { name: "Whiteheads", emoji: "⚪" },
    { name: "Papules", emoji: "🔴" },
    { name: "Pustules", emoji: "🟡" },
    { name: "Cysts", emoji: "🟣" }
];

const Home = () => {
    const { user } = useAuth();
    const [selectedAcne, setSelectedAcne] = useState(null);
    const [stats, setStats] = useState({ accuracy: '85.00', totalImages: '4000+' });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/stats');
                const data = await res.json();
                setStats({
                    accuracy: typeof data.accuracy === 'number' ? data.accuracy.toFixed(2) : data.accuracy,
                    totalImages: data.total_images || '4000+',
                });
            } catch (err) {
                console.error("Failed to fetch stats from backend", err);
            }
        };
        fetchStats();
    }, []);

    const handleTypeClick = (name) => {
        setSelectedAcne(selectedAcne === name ? null : name);
    };

    const selectedData = selectedAcne
        ? Object.values(OLD_ACNE_DATA).flat().find(t => t.name === selectedAcne)
        : null;

    return (
        <div className="app-layout">
            <Navbar />

            <main className="home-main">
                {/* Hero Section */}
                <section className="hero">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            AI-Based<br />
                            <span className="hero-highlight">Acne Detection</span> &amp;<br />
                            Classification
                        </h1>
                        <p className="hero-description">
                            Detect and Classify Acne Types using Advanced Image Analysis
                        </p>
                        <div className="hero-buttons">
                            <Link to="/analyze" className="btn-primary">
                                <span>📤</span> Start Analysis
                            </Link>
                            <Link to="/info" className="btn-secondary">
                                Learn More
                            </Link>
                        </div>
                        <div className="hero-badges">
                            <span className="badge">⚡ Fast</span>
                            <span className="badge">🎯 {stats.accuracy}% Accuracy</span>
                            <span className="badge">📊 {stats.totalImages} Images Trained</span>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-image-container">
                            <div className="hero-main-bg" style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '400px',
                                backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.1) 100%), url(${heroBg})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center 20%',
                                borderRadius: '2px'
                            }}></div>
                            {acneTypes.map((type, index) => {
                                const positions = [
                                    { top: '4%', right: '22%' },
                                    { top: '23%', right: '20%' },
                                    { top: '42%', right: '19.5%' },
                                    { top: '67%', right: '20.5%' }, // Changed left: '16.5%' to right: '16.5%'
                                    { top: '78%', right: '28.5%' }
                                ];
                                return (
                                    <button
                                        key={index}
                                        className={`floating-label ${selectedAcne === type.name ? 'selected' : ''}`}
                                        style={positions[index]}
                                        onClick={() => handleTypeClick(type.name)}
                                    >
                                        {type.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>



                {/* Inline Acne Detail Section */}
                {selectedData && (
                    <div className="home-detail-wrapper" style={{ padding: '200 3rem' }}>
                        <div className="tree-detail-card" style={{ margin: '0 auto 3rem' }}>
                            <div className="detail-header">
                                <h2>{selectedData.emoji} {selectedData.name}</h2>
                                <span className={`severity-badge severity-${selectedData.severity.toLowerCase()}`}>
                                    {selectedData.severity}
                                </span>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <h3>📋 Description</h3>
                                    <p>{selectedData.description}</p>
                                </div>
                                <div className="detail-item">
                                    <h3>👁️ Appearance</h3>
                                    <p>{selectedData.appearance}</p>
                                </div>
                                <div className="detail-item">
                                    <h3>⚠️ Causes</h3>
                                    <p>{selectedData.causes}</p>
                                </div>
                            </div>
                            <div className="detail-action" style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <Link to={`/info?type=${selectedData.name}`} className="btn-secondary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
                                    View in Classification Tree →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA Section
                <section className="cta-section">
                    <div className="cta-content">
                        <p className="cta-subtitle">Upload Your Image for</p>
                        <h2 className="cta-title">Instant Analysis!</h2>
                        <Link to="/analyze" className="btn-cta">
                            Analyze Now →
                        </Link>
                    </div>
                </section> */}

                {/* How It Works Section */}
                <section className="how-it-works">
                    <div className="section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Get your skin analysis in three simple steps</p>
                    </div>

                    <div className="steps-container">
                        <div className="step-connector"></div>
                        <div className="steps-grid">
                            <div className="step-card">
                                <span className="step-number">01</span>
                                <div className="step-icon-wrapper">
                                    <span className="step-icon">📤</span>
                                </div>
                                <h3 className="step-title">Upload Image</h3>
                                <p className="step-text">Take a photo or upload an existing image of your skin</p>
                            </div>

                            <div className="step-card">
                                <span className="step-number">02</span>
                                <div className="step-icon-wrapper">
                                    <span className="step-icon">🤖</span>
                                </div>
                                <h3 className="step-title">AI Analysis</h3>
                                <p className="step-text">Our AI analyzes your skin for acne and other conditions</p>
                            </div>

                            <div className="step-card">
                                <span className="step-number">03</span>
                                <div className="step-icon-wrapper">
                                    <span className="step-icon">📄</span>
                                </div>
                                <h3 className="step-title">Get Results</h3>
                                <p className="step-text">Receive detailed severity assessment and recommendations</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Project Section */}
                <section className="about-project">
                    <div className="about-container">
                        <div className="about-content">
                            <h2 className="about-title">About AcneAI</h2>
                            <p className="about-description">
                                <strong>AcneAI</strong> is a cutting-edge platform dedicated to revolutionizing skin health through the power of Artificial Intelligence. Our mission is to provide accessible, accurate, and instant acne analysis to help users understand their skin conditions better.
                            </p>
                            <p className="about-description">
                                Leveraging advanced <strong>Deep Learning</strong> and <strong>Computer Vision</strong>, our system classifies acne into five distinct types with high precision. Whether you are dealing with mild blackheads or severe cysts, AcneAI provides the insights you need to take the next step toward clearer skin.
                            </p>
                            <div className="about-features">
                                <div className="about-feature">
                                    <span className="feature-icon">🛡️</span>
                                    <span>Privacy First</span>
                                </div>
                                <div className="about-feature">
                                    <span className="feature-icon">📈</span>
                                    <span>Accuracy Driven</span>
                                </div>
                                <div className="about-feature">
                                    <span className="feature-icon">💡</span>
                                    <span>User Centric</span>
                                </div>
                            </div>
                        </div>
                        <div className="about-stats">
                            <div className="stat-item">
                                <span className="stat-value">85%</span>
                                <span className="stat-label">Model Accuracy</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">4000+</span>
                                <span className="stat-label">Images Trained On</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Welcome bar */}
                {user && (
                    <div className="welcome-bar">
                        👋 Thank you for using AcneAI, <strong>{user.name}</strong>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;

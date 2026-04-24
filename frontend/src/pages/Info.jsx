import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

import { NEW_ACNE_DATA as acneData } from '../constants/acneData';

const TreeSVG = ({ selectedType }) => {
    // Positions for SVG tree
    const root = { x: 450, y: 40 };
    const categories = [
        { x: 200, y: 150, label: "Non-Inflammatory", color: "#3498db" },
        { x: 700, y: 150, label: "Inflammatory", color: "#e74c3c" }
    ];
    const leaves = [
        // Non-inflammatory
        { x: 130, y: 280, name: "Blackheads", parent: 0 },
        { x: 270, y: 280, name: "Whiteheads", parent: 0 },
        // Inflammatory
        { x: 570, y: 280, name: "Papules", parent: 1 },
        { x: 700, y: 280, name: "Pustules", parent: 1 },
        { x: 830, y: 280, name: "Cysts", parent: 1 },
    ];

    return (
        <svg className="tree-svg" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#bbb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#bbb" stopOpacity="1" />
                </linearGradient>
            </defs>

            {/* Lines from root to categories */}
            {categories.map((cat, i) => (
                <line key={`root-${i}`} x1={root.x} y1={root.y + 25} x2={cat.x} y2={cat.y - 25}
                    stroke="#ccc" strokeWidth="2" strokeDasharray="6,4" className="tree-line-anim" />
            ))}

            {/* Lines from categories to leaves */}
            {leaves.map((leaf, i) => (
                <line key={`leaf-${i}`}
                    x1={categories[leaf.parent].x} y1={categories[leaf.parent].y + 25}
                    x2={leaf.x} y2={leaf.y - 25}
                    stroke="#ddd" strokeWidth="1.5" strokeDasharray="4,3" className="tree-line-anim" />
            ))}

            {/* Root node */}
            <circle cx={root.x} cy={root.y} r="28" fill="#2E2B41" filter="url(#glow)" className="node-pulse" />
            <text x={root.x} y={root.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="20" fill="white">🧬</text>
            <text x={root.x} y={root.y + 48} textAnchor="middle"
                fontSize="13" fontWeight="700" fill="#2E2B41">Acne Types</text>

            {/* Category nodes */}
            {categories.map((cat, i) => (
                <g key={`cat-${i}`}>
                    <circle cx={cat.x} cy={cat.y} r="22" fill={cat.color} filter="url(#glow)" className="node-pulse" />
                    <text x={cat.x} y={cat.y + 45} textAnchor="middle"
                        fontSize="12" fontWeight="600" fill={cat.color}>{cat.label}</text>
                </g>
            ))}

            {/* Leaf nodes — rendered in JSX below as HTML for interactivity */}
        </svg>
    );
};

const Info = () => {
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type');
    const [selectedType, setSelectedType] = useState(initialType || null);

    const handleTypeClick = (name) => {
        setSelectedType(selectedType === name ? null : name);
    };

    const selectedData = selectedType
        ? Object.values(acneData).flat().find(t => t.name === selectedType)
        : null;

    const allTypes = Object.values(acneData).flat();

    return (
        <div className="app-layout">
            <Navbar />
            <div className="page-container info-page">
                <h1>Acne Classification Tree</h1>
                <p className="page-intro">
                    Explore the classification of acne types. Click on any type to learn more.
                </p>

                {/* Visual Decision Tree */}
                <div className="decision-tree-wrapper">
                    <div className="decision-tree">
                        <TreeSVG selectedType={selectedType} />

                        {/* Interactive leaf nodes overlaid on the SVG */}
                        <div className="leaf-overlay">
                            <div className="leaf-group-left">
                                {acneData["Non-Inflammatory"].map((type) => (
                                    <button
                                        key={type.name}
                                        className={`leaf-btn ${selectedType === type.name ? 'selected' : ''}`}
                                        onClick={() => handleTypeClick(type.name)}
                                    >
                                        <span className="leaf-circle">{type.emoji}</span>
                                        <span className="leaf-label">{type.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="leaf-group-right">
                                {acneData["Inflammatory"].map((type) => (
                                    <button
                                        key={type.name}
                                        className={`leaf-btn ${selectedType === type.name ? 'selected' : ''}`}
                                        onClick={() => handleTypeClick(type.name)}
                                    >
                                        <span className="leaf-circle">{type.emoji}</span>
                                        <span className="leaf-label">{type.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Card */}
                {selectedData && (
                    <div className="tree-detail-card" key={selectedType}>
                        <div className="detail-header">
                            <h2>{selectedData.emoji} {selectedData.name}</h2>
                            <span className={`severity-badge severity-${selectedData.severity.toLowerCase()}`}>
                                {selectedData.severity}
                            </span>
                        </div>
                        <div className="detail-grid">
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <h3>📋 Description</h3>
                                <p>{selectedData.description}</p>
                            </div>
                            <div className="detail-item">
                                <h3>🔍 Appearance</h3>
                                <p>{selectedData.appearance}</p>
                            </div>
                            <div className="detail-item">
                                <h3>💡 Causes</h3>
                                <p>{selectedData.causes}</p>
                            </div>
                            <div className="detail-item">
                                <h3>✅ Natural Care</h3>
                                <p>{selectedData.recommendations}</p>
                            </div>
                            <div className="detail-item">
                                <h3>🛡️ Avoidance Guide</h3>
                                <p>{selectedData.precautions}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!selectedData && (
                    <div className="tree-hint">
                        <p>👆 Click on any acne type above to see details</p>
                    </div>
                )}

                <Link to="/" className="back-link">Back to Home</Link>
            </div>
        </div>
    );
};

export default Info;

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { identifyAcne } from '../services/cnn_service';
import { useAuth } from '../login_system/AuthContext';

const Analyze = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth(); // Destructure user context to get the user ID if logged in

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setError(null);
    try {
      // Pass the actual File object and user id
      const userId = user ? user.id : null;
      const prediction = await identifyAcne(selectedImage, userId);
      setResult(prediction);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze image. Please ensure the Python backend is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="page-container">
        <header className="analyze-header">
          <h1>Analyze Your Skin</h1>
          <p>Our advanced CNN model will identify potential acne types from your photo.</p>
        </header>

        <div className="analyze-content">
          {!result ? (
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />

              {!previewUrl ? (
                <div className="drop-zone" onClick={triggerFileInput}>
                  <div className="upload-icon">📸</div>
                  <p>Click to upload or drag and drop</p>
                  <span>Supports JPG, PNG (Max 5MB)</span>
                </div>
              ) : (
                <div className="preview-container">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="image-preview"
                  />
                  <button className="change-btn" onClick={triggerFileInput} disabled={analyzing}>
                    Change Image
                  </button>
                </div>
              )}

              {error && <div className="error-message" style={{ color: '#ff4d4f', marginTop: '1rem' }}>{error}</div>}

              <button
                className={`analyze-btn ${analyzing ? 'loading' : ''}`}
                onClick={handleAnalyze}
                disabled={!selectedImage || analyzing}
              >
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          ) : (
            <div className="result-section fade-in">
              <div className="result-image-display">
                <img src={previewUrl} alt="Analyzed Skin" className="main-result-image" />
              </div>
              <div className="result-card">
                <div className="result-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                  <span className="result-emoji">{result.emoji}</span>
                  <div className="result-title-group">
                    <h2>{result.name}</h2>
                    <span className={`severity-tag ${result.severity.toLowerCase()}`}>
                      {result.severity} Severity
                    </span>
                  </div>
                  <div className="confidence-score">
                    <span className="score-value">{result.confidence}%</span>
                    <span className="score-label">Confidence</span>
                  </div>
                </div>

                <div className="severity-details">
                  <div className="severity-score-box">
                    <h3>Severity Score</h3>
                    <div className="score-circle">
                      <span className="score-num">{result.severityScore}</span>
                      <span className="score-max">/10</span>
                    </div>
                  </div>
                  <div className="recommendation-box">
                    <h3>Natural Care & Avoidance</h3>
                    <div className="rec-content">
                      <div className="rec-item">
                        <strong>Natural Care:</strong>
                        <p>{result.recommendations}</p>
                      </div>
                      <div className="rec-item">
                        <strong>Avoidance Guide:</strong>
                        <p>{result.precautions}</p>
                      </div>
                    </div>
                    {result.severity === 'Severe' && (
                      <div className="doctor-alert">
                        ⚠️ High Severity: Please consult a professional dermatologist.
                      </div>
                    )}
                  </div>
                </div>

                <div className="result-footer" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(14, 141, 67, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to="/info" className="more-info-link">Learn more about {result.name}</Link>
                  <button
                    className="reanalyze-btn"
                    onClick={() => { setResult(null); setSelectedImage(null); setPreviewUrl(null); }}
                  >
                    Re-analyze
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Link to="/" className="back-link">Back to Home</Link>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .analyze-header {
          text-align: center;
          margin-bottom: 2rem;
        }
      
        .analyze-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .upload-section {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .drop-zone {
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 3rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .drop-zone:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #646cff;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .preview-container {
          position: relative;
          margin-bottom: 2rem;
        }

        .image-preview {
          max-width: 100%;
          max-height: 400px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .change-btn {
          margin-top: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          color: white;
        }

        .analyze-btn {
          width: 100%;
          margin-top: 1.5rem;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #646cff, #747bff);
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .analyze-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analyze-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(100, 108, 255, 0.4);
        }

        .result-card {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .result-image-display {
          margin-bottom: 2rem;
          text-align: center !important;
          width: 60%;
          height: 60%;
          animation: scaleIn 0.5s ease-out backwards;
          animation-delay: 0.2s;
        }

        .main-result-image {
          max-width: 100%;
          max-height: 450px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .result-emoji {
          font-size: 3.5rem;
        }

        .result-title-group h2 {
          margin: 0;
          font-size: 2rem;
        }

        .severity-tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        .severity-tag.mild { background: #4caf50; }
        .severity-tag.moderate { background: #ff9800; }
        .severity-tag.severe { background: #f44336; }

        .confidence-score {
          margin-left: auto;
          text-align: right;
        }

        .score-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          color: #646cff;
        }

        .score-label {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .info-group h3 {
          font-size: 1rem;
          opacity: 0.6;
          margin-bottom: 0.5rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }

        .result-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .severity-details {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 2rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .severity-score-box {
          text-align: center;
        }

        .severity-score-box h3 {
          font-size: 0.9rem;
          opacity: 0.7;
          margin-bottom: 1rem;
        }

        .score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 4px solid #646cff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 0 auto;
          background: rgba(100, 108, 255, 0.1);
        }

        .score-num {
          font-size: 2rem;
          font-weight: 800;
          color: #646cff;
          line-height: 1;
        }

        .score-max {
          font-size: 0.8rem;
          opacity: 0.6;
        }

        .recommendation-box h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #fff;
        }

        .rec-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rec-item {
          background: rgba(255, 255, 255, 0.03);
          padding: 1rem;
          border-radius: 10px;
          border-left: 3px solid #646cff;
        }

        .rec-item strong {
          display: block;
          font-size: 0.85rem;
          color: #646cff;
          margin-bottom: 0.3rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rec-item p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
          opacity: 0.9;
        }

        .doctor-alert {
          margin-top: 1.5rem;
          background: rgba(244, 67, 54, 0.15);
          color: #ff5252;
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid rgba(244, 67, 54, 0.3);
          font-weight: 600;
          text-align: center;
        }

        .more-info-link {
          color: #646cff;
          text-decoration: none;
          font-weight: 600;
        }

        .reanalyze-btn {
          background: rgba(6, 18, 249, 0.2);
          border: 1px solid rgba(7, 20, 255, 0.4);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reanalyze-btn:hover {
          background: rgba(15, 27, 237, 0.6);
        }

        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
          .result-header { flex-direction: column; text-align: center; }
          .confidence-score { margin-left: 0; text-align: center; }
          .severity-details { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
};

export default Analyze;

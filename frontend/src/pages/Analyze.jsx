import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { identifyAcne } from '../services/cnn_service';
import { useAuth } from '../login_system/AuthContext';

const emojiMap = {
  'blackheads': '⚫',
  'whiteheads': '⚪',
  'papules': '🔴',
  'pustules': '🟡',
  'nodules': '🟤',
  'cysts': '🟣',
  'cyst': '🟣'
};

const Analyze = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('Initializing analysis...');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useAuth(); // Destructure user context to get the user ID if logged in

  useEffect(() => {
    let interval;
    if (analyzing) {
      const statuses = [
        'Uploading skin sample to AcneAI backend...',
        'Preprocessing image & adjusting contrast...',
        'Detecting face boundaries & zones...',
        'Extracting high-dimensional features...',
        'Running convolutional YOLOv5 acne detector...',
        'Running CNN severity classifier...',
        'Compiling dermatologist care recommendations...',
        'Generating final diagnostics...'
      ];
      let currentIndex = 0;
      setLoadingStatusText(statuses[0]);
      
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % statuses.length;
        setLoadingStatusText(statuses[currentIndex]);
      }, 1600);
    } else {
      setLoadingStatusText('Initializing analysis...');
    }
    return () => clearInterval(interval);
  }, [analyzing]);

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
      setIsCameraMode(false); // Switch out of camera mode if a file is selected
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setIsCameraMode(true);
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please ensure you have given permission.");
    }
  };

  // Attach stream to video element when it's available
  useEffect(() => {
    if (stream && videoRef.current && isCameraMode) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError("Camera not ready. Please try again in a moment.");
        return;
      }

      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          setError("Failed to capture image. Please try again.");
          return;
        }
        const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
    <>
      <DashboardLayout>
      {!result ? (
        <div className="dashboard-upload-wrapper fade-in">
              <div className="dashboard-card upload-dashboard-card">
                <div className="card-header">
                  <h2>Analyze Your Skin</h2>
                  <p className="card-subtitle">Our advanced CNN model will identify potential acne types from your photo.</p>
                </div>

                <div className="upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />

                  {!previewUrl ? (
                    <>
                      {!isCameraMode ? (
                        <div className="upload-options">
                          <div className="drop-zone" onClick={triggerFileInput}>
                            <div className="upload-icon">📁</div>
                            <p>Click to upload or drag and drop</p>
                            <span>Supports JPG, PNG (Max 5MB)</span>
                          </div>
                          <div className="or-divider">OR</div>
                          <button className="camera-start-btn" onClick={startCamera}>
                            <span className="btn-icon">📷</span> Use Live Camera
                          </button>
                        </div>
                      ) : (
                        <div className="camera-container fade-in">
                          <div className="video-wrapper">
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted
                              className="camera-video"
                            />
                            <div className="camera-overlay"></div>
                          </div>
                          <canvas ref={canvasRef} style={{ display: 'none' }} />
                          <div className="camera-controls">
                            <button className="capture-btn" onClick={capturePhoto}>
                              <div className="capture-inner"></div>
                            </button>
                            <button className="cancel-camera-btn" onClick={stopCamera}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="preview-container">
                      <div className="preview-image-wrapper">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className={`image-preview ${analyzing ? 'blur-active' : ''}`}
                        />
                        {analyzing && (
                          <div className="scanning-overlay">
                            <div className="scanning-beam"></div>
                            <div className="scanning-glow"></div>
                            <div className="scanning-text-container">
                              <div className="spinner-ring"></div>
                              <p className="scanning-status">{loadingStatusText}</p>
                              <span className="scanning-subtext">AcneAI is classifying skin conditions...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="preview-actions">
                        <button className="change-btn" onClick={triggerFileInput} disabled={analyzing}>
                          Upload Different
                        </button>
                        <button className="change-btn" onClick={startCamera} disabled={analyzing}>
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {error && <div className="error-message" style={{ color: '#ff4d4f', marginTop: '1rem', fontWeight: '600' }}>{error}</div>}

                  <button
                    className={`analyze-btn ${analyzing ? 'loading' : ''}`}
                    onClick={handleAnalyze}
                    disabled={!selectedImage || analyzing || isCameraMode}
                    style={{ marginTop: '2rem' }}
                  >
                    {analyzing ? (
                      <>
                        <span className="btn-spinner"></span>
                        Analyzing Skin...
                      </>
                    ) : 'Analyze'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="result-dashboard-grid fade-in">
              {/* Left Column: Visualizer & AI Insights */}
              <div className="dashboard-col-left">
                {/* Skin Analysis Visualizer Card */}
                <div className="dashboard-card visualizer-card">
                  <div className="card-header">
                    <h3>Skin Analysis Visualizer</h3>
                  </div>
                  <div className="visualizer-content">
                    <div className="result-image-wrapper">
                      <img src={previewUrl} alt="Analyzed Skin" className="main-result-image" />
                      {result.detections && result.detections.map((det, index) => {
                        // Determine border color and badge color based on detection class
                        const cls = det.class.toLowerCase();
                        let color = '#FF6B35'; // Default Orange
                        if (cls.includes('pustule')) {
                          color = '#f44336'; // Red
                        } else if (cls.includes('dark spot') || cls.includes('hyperpigmentation') || cls.includes('darkspot')) {
                          color = '#e040fb'; // Magenta/Pink
                        } else if (cls.includes('papule')) {
                          color = '#ff9800'; // Orange
                        } else if (cls.includes('blackhead')) {
                          color = '#212121'; // Black/Dark
                        } else if (cls.includes('whitehead')) {
                          color = '#00afb9'; // Teal
                        } else if (cls.includes('cyst') || cls.includes('nodule')) {
                          color = '#9b5de5'; // Purple
                        }

                        return (
                          <div
                            key={index}
                            className="detection-box-wrapper"
                            style={{
                              position: 'absolute',
                              left: `${(det.box[0] / result.dims[0]) * 100}%`,
                              top: `${(det.box[1] / result.dims[1]) * 100}%`,
                              width: `${((det.box[2] - det.box[0]) / result.dims[0]) * 100}%`,
                              height: `${((det.box[3] - det.box[1]) / result.dims[1]) * 100}%`,
                              border: `2px solid ${color}`,
                              borderRadius: '4px',
                              pointerEvents: 'none',
                              zIndex: 10
                            }}
                          >
                            <span 
                              className="detection-box-label"
                              style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '-2px',
                                background: color,
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                              }}
                            >
                              {det.class} {det.confidence ? det.confidence.toFixed(2) : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Smart AI Interpretation Card */}
                <div className="dashboard-card interpretation-card">
                  <div className="card-header-badge">
                    <h3 className="card-title">Smart AI Interpretation</h3>
                    <span className="insights-badge">AI INSIGHTS</span>
                  </div>
                  <div className="interpretation-content">
                    <p className="interpretation-text">
                      {(() => {
                        const total = result.detections ? result.detections.length : 0;
                        if (total === 0) {
                          return `No acne lesions were detected in the analyzed sample. Your skin appears to be clear and healthy. Maintain a proper daily hygiene routine to keep it that way.`;
                        }

                        // Calculate class distribution
                        const counts = {};
                        result.detections.forEach(d => {
                          const c = d.class.charAt(0).toUpperCase() + d.class.slice(1);
                          counts[c] = (counts[c] || 0) + 1;
                        });

                        // Find dominant class
                        let dominantClass = '';
                        let maxCount = 0;
                        Object.keys(counts).forEach(c => {
                          if (counts[c] > maxCount) {
                            maxCount = counts[c];
                            dominantClass = c;
                          }
                        });

                        const dominantPercent = ((maxCount / total) * 100).toFixed(1);
                        
                        return `Mixed acne detected with ${total} total lesions. Dominant type is ${dominantClass} (${dominantPercent}%).`;
                      })()}
                    </p>

                    <div className="interpretation-details">
                      <div className="detail-row">
                        <span className="detail-label">📋 Natural Care:</span>
                        <p className="detail-value">{result.recommendations || "Wash your face twice daily with a gentle, non-comedogenic cleanser. Keep skin hydrated."}</p>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">⚠️ Avoidance Guide:</span>
                        <p className="detail-value">{result.precautions || "Avoid popping or squeezing spots, touching your face frequently, and using oily cosmetics."}</p>
                      </div>
                    </div>

                    {result.severity === 'Severe' && (
                      <div className="doctor-urgent-alert">
                        ⚠️ <strong>Urgent Note:</strong> High severity acne detected. We strongly recommend consulting a professional dermatologist for a personalized medical treatment plan.
                      </div>
                    )}
                  </div>

                  <div className="card-actions-row">
                    <Link to="/info" className="wiki-link-btn">Learn more in Acne Wiki</Link>
                    <button
                      className="reanalyze-dashboard-btn"
                      onClick={() => { setResult(null); setSelectedImage(null); setPreviewUrl(null); }}
                    >
                      Re-analyze
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Cards Panel */}
              <div className="dashboard-col-right">
                {/* Summary Grid: Total Spots & Severity */}
                <div className="summary-cards-grid">
                  {/* Total Spots Card */}
                  <div className="summary-metric-card">
                    <div className="metric-icon-wrapper spots-icon">🎯</div>
                    <div className="metric-info">
                      <span className="metric-label">Total Spots</span>
                      <span className="metric-value">{result.detections ? result.detections.length : 0}</span>
                    </div>
                  </div>

                  {/* Severity Card */}
                  <div className="summary-metric-card">
                    <div className="metric-icon-wrapper severity-icon">🛡️</div>
                    <div className="metric-info">
                      <span className="metric-label">Severity</span>
                      <span className="metric-value severity-text">{result.severity || 'Mild'}</span>
                    </div>
                  </div>
                </div>

                {/* Acne Composition Card */}
                <div className="dashboard-card composition-card">
                  <div className="card-header-badge">
                    <h3>Acne Composition</h3>
                    <span className="spots-count-badge">{result.detections ? result.detections.length : 0} Spots</span>
                  </div>
                  <div className="composition-content">
                    {(() => {
                      const total = result.detections ? result.detections.length : 0;
                      if (total === 0) {
                        return <div className="no-composition-data">No spots detected</div>;
                      }

                      // Count instances of each class
                      const counts = {};
                      result.detections.forEach(d => {
                        const capitalized = d.class.charAt(0).toUpperCase() + d.class.slice(1);
                        counts[capitalized] = (counts[capitalized] || 0) + 1;
                      });

                      // Sort by count descending
                      const sortedClasses = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

                      return sortedClasses.map(clsName => {
                        const count = counts[clsName];
                        const percent = ((count / total) * 100).toFixed(1);
                        
                        // Get progress bar color
                        let progressColor = '#FF6B35'; // Default Orange
                        const lowerCls = clsName.toLowerCase();
                        if (lowerCls.includes('pustule')) {
                          progressColor = '#f44336'; // Red
                        } else if (lowerCls.includes('dark spot') || lowerCls.includes('hyperpigmentation') || lowerCls.includes('darkspot')) {
                          progressColor = '#2ec4b6'; // Teal
                        } else if (lowerCls.includes('papule')) {
                          progressColor = '#ff9800'; // Orange
                        } else if (lowerCls.includes('blackhead')) {
                          progressColor = '#4a4e69'; // Dark Purple/Gray
                        } else if (lowerCls.includes('whitehead')) {
                          progressColor = '#00afb9'; // Teal Blue
                        } else if (lowerCls.includes('cyst') || lowerCls.includes('nodule')) {
                          progressColor = '#9b5de5'; // Purple
                        }

                        return (
                          <div key={clsName} className="composition-row">
                            <div className="composition-label-row">
                              <span className="cls-name">{clsName}</span>
                              <span className="cls-percentage">{percent}%</span>
                            </div>
                            <div className="progress-bar-track">
                              <div 
                                className="progress-bar-fill" 
                                style={{ 
                                  width: `${percent}%`,
                                  backgroundColor: progressColor
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* AI Confidence Card */}
                <div className="dashboard-card confidence-donut-card">
                  <div className="card-header-badge">
                    <h3>AI Confidence</h3>
                    <span className="confidence-badge">{result.confidence}%</span>
                  </div>
                  <div className="confidence-content">
                    <div className="donut-chart-wrapper">
                      {(() => {
                        const conf = parseFloat(result.confidence);
                        const r = 40; // Radius
                        const circ = 2 * Math.PI * r;
                        const strokeDashoffset = circ - (conf / 100) * circ;

                        return (
                          <svg className="circular-gauge" viewBox="0 0 100 100">
                            <circle 
                              className="gauge-bg"
                              cx="50" 
                              cy="50" 
                              r={r} 
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle 
                              className="gauge-fill"
                              cx="50" 
                              cy="50" 
                              r={r} 
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={circ}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                        );
                      })()}
                      <div className="donut-inner-text">
                        <span className="donut-val">{result.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </DashboardLayout>

    <style dangerouslySetInnerHTML={{
        __html: `
        /* Dashboard Cards Common */
        .dashboard-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          margin-bottom: 2rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .dashboard-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }

        .dashboard-card .card-header {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 1rem;
          margin-bottom: 1.25rem;
        }

        .dashboard-card .card-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .card-header-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 1rem;
          margin-bottom: 1.25rem;
        }

        .card-header-badge h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        /* Dynamic Grid Layout */
        .result-dashboard-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 2rem;
          max-width: 1300px;
          margin: 0 auto;
        }

        .dashboard-col-left {
          display: flex;
          flex-direction: column;
        }

        .dashboard-col-right {
          display: flex;
          flex-direction: column;
        }

        /* Skin Analysis Visualizer Card */
        .visualizer-card {
          overflow: hidden;
        }

        .visualizer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #0f172a;
          border-radius: 16px;
          padding: 1rem;
          min-height: 350px;
        }

        .result-image-wrapper {
          position: relative;
          display: inline-block;
          max-width: 100%;
        }

        .main-result-image {
          display: block;
          max-width: 100%;
          max-height: 480px;
          border-radius: 12px;
          object-fit: contain;
        }

        /* Smart AI Interpretation */
        .interpretation-card {
          padding: 2rem;
        }

        .insights-badge {
          background-color: #fff3ed;
          color: #FF6B35;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }

        .interpretation-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #334155;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 1.5rem;
        }

        .interpretation-details {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .detail-row {
          background-color: #f8fafc;
          padding: 1.25rem;
          border-radius: 12px;
          border-left: 4px solid #FF6B35;
        }

        .detail-row .detail-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #FF6B35;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .detail-row .detail-value {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #475569;
        }

        .doctor-urgent-alert {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1.25rem;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.75rem;
        }

        .card-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 1.5rem;
        }

        .wiki-link-btn {
          color: #FF6B35;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .wiki-link-btn:hover {
          color: #e55a25;
        }

        .reanalyze-dashboard-btn {
          background-color: #FF6B35;
          color: #ffffff;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reanalyze-dashboard-btn:hover {
          background-color: #e55a25;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
        }

        /* Metric Cards */
        .summary-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-metric-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .metric-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .spots-icon {
          background-color: #fdf2f8;
          color: #db2777;
        }

        .severity-icon {
          background-color: #eff6ff;
          color: #2563eb;
        }

        .metric-info {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.2;
        }

        .metric-value.severity-text {
          font-size: 1.25rem;
        }

        /* Acne Composition */
        .spots-count-badge {
          background-color: #fff3ed;
          color: #FF6B35;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }

        .composition-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .composition-row {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .composition-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          font-weight: 700;
          color: #334155;
        }

        .progress-bar-track {
          width: 100%;
          height: 8px;
          background-color: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .no-composition-data {
          text-align: center;
          color: #64748b;
          font-size: 0.95rem;
          padding: 1rem;
        }

        /* AI Confidence Card */
        .confidence-badge {
          background-color: #fff3ed;
          color: #FF6B35;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }

        .confidence-content {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem 0;
        }

        .donut-chart-wrapper {
          position: relative;
          width: 150px;
          height: 150px;
        }

        .circular-gauge {
          width: 100%;
          height: 100%;
        }

        .gauge-bg {
          stroke: #f1f5f9;
        }

        .gauge-fill {
          stroke: #FF6B35;
          transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .donut-inner-text {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-val {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1e293b;
        }

        /* Upload Card Dashboard Wrap */
        .upload-dashboard-card {
          max-width: 650px;
          margin: 2rem auto;
          padding: 2.5rem;
        }

        .upload-dashboard-card .card-header {
          text-align: center;
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 2rem;
        }

        .upload-dashboard-card .card-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .upload-dashboard-card .card-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }

        /* Original Upload, Preview, Camera and Scan Elements preserved/integrated */
        .upload-section {
          text-align: center;
        }

        .drop-zone {
          border: 2px dashed rgba(46, 43, 65, 0.25);
          border-radius: 15px;
          padding: 3rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .drop-zone:hover {
          background: #f1f5f9;
          border-color: #FF6B35;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .preview-container {
          position: relative;
          margin-bottom: 2rem;
        }

        .preview-image-wrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          display: inline-block;
          max-width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .image-preview {
          display: block;
          max-width: 100%;
          max-height: 400px;
          border-radius: 12px;
          transition: filter 0.5s ease, transform 0.5s ease;
        }

        .image-preview.blur-active {
          filter: brightness(0.4) blur(3px);
          transform: scale(1.02);
        }

        .scanning-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(46, 43, 65, 0.45);
          backdrop-filter: blur(2px);
          z-index: 10;
          border-radius: 12px;
          overflow: hidden;
          animation: fadeIn 0.3s ease-out;
        }

        .scanning-beam {
          position: absolute;
          width: 100%;
          height: 5px;
          background: linear-gradient(90deg, transparent, #FF6B35, transparent);
          box-shadow: 0 0 12px #FF6B35, 0 0 20px #FF6B35;
          animation: scan 2.4s ease-in-out infinite;
          top: 0;
          z-index: 12;
        }

        .scanning-glow {
          position: absolute;
          width: 100%;
          height: 100px;
          background: linear-gradient(180deg, rgba(255, 107, 53, 0.25) 0%, transparent 100%);
          animation: scanGlow 2.4s ease-in-out infinite;
          top: 0;
          z-index: 11;
        }

        @keyframes scan {
          0% { top: 0%; transform: translateY(0); }
          50% { top: 100%; transform: translateY(-5px); }
          100% { top: 0%; transform: translateY(0); }
        }

        @keyframes scanGlow {
          0% { top: -100px; transform: scaleY(1); }
          50% { top: calc(100% - 5px); transform: scaleY(-1); }
          100% { top: -100px; transform: scaleY(1); }
        }

        .scanning-text-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          max-width: 85%;
          z-index: 15;
          text-align: center;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .spinner-ring {
          width: 44px;
          height: 44px;
          border: 3.5px solid rgba(255, 107, 53, 0.2);
          border-top: 3.5px solid #FF6B35;
          border-right: 3.5px solid #FF6B35;
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          margin-bottom: 0.8rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .scanning-status {
          color: #1e293b;
          font-weight: 700;
          font-size: 1.05rem;
          margin: 0 0 0.3rem 0;
          letter-spacing: 0.1px;
          min-height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scanning-subtext {
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .change-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          color: #475569;
          font-weight: 600;
          transition: all 0.2s;
        }

        .change-btn:hover {
          background: #f8fafc;
          border-color: #FF6B35;
          color: #FF6B35;
        }

        .preview-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .upload-options {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .or-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .or-divider::before,
        .or-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }

        .or-divider:not(:empty)::before { margin-right: 1rem; }
        .or-divider:not(:empty)::after { margin-left: 1rem; }

        .camera-start-btn {
          background: #fff3ed;
          border: 1px dashed #ffd8c9;
          color: #FF6B35;
          padding: 1rem;
          border-radius: 15px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
        }

        .camera-start-btn:hover {
          background: #ffebe0;
          border-color: #FF6B35;
          transform: translateY(-2px);
        }

        .camera-container {
          position: relative;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        .video-wrapper {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
          aspect-ratio: 4/3;
        }

        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .camera-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid rgba(255, 107, 53, 0.2);
          pointer-events: none;
        }

        .camera-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .capture-btn {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: white;
          border: 4px solid #FF6B35;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.2s;
        }

        .capture-btn:hover { transform: scale(1.1); }
        .capture-btn:active { transform: scale(0.9); }

        .capture-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #FF6B35;
        }

        .cancel-camera-btn {
          background: #f1f5f9;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          color: #475569;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-camera-btn:hover {
          background: #e2e8f0;
        }

        .analyze-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          background: #FF6B35;
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
        }

        .analyze-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .analyze-btn.loading {
          background: #FF6B35;
          opacity: 0.8;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.35);
          border-top: 2.5px solid white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        .analyze-btn:not(:disabled):not(.loading):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .result-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
          
          .main-content-wrapper {
            margin-left: 0;
          }
        }
      `}} />
    </>
  );
};

export default Analyze;

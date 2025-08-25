import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", { email, password });
      
      if (response.data.token) {
        // Pass the complete user data object to match AuthContext.login signature
        await login({
          token: response.data.token,
          username: response.data.user?.username || response.data.username || email.split('@')[0]
        });
        navigate("/home");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Custom Cursor */}
      <div 
        ref={cursorRef}
        className="custom-cursor"
        style={{
          left: mousePosition.x,
          top: mousePosition.y
        }}
      />

      {/* Background Elements */}
      <div className="auth-background">
        <div className="gradient-mesh"></div>
        <div className="floating-elements">
          <div className="element element-1">🔐</div>
          <div className="element element-2">⚡</div>
          <div className="element element-3">🚀</div>
          <div className="element element-4">💻</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="logo-section">
              <div className="logo-icon">🎨</div>
              <h1 className="logo-text">Collaborative Canvas</h1>
            </div>
            
            <div className="welcome-badge">
              <span className="badge-icon">👋</span>
              <span className="badge-text">Welcome Back</span>
            </div>
            
            <h2 className="auth-title">Sign In to Your Account</h2>
            <p className="auth-subtitle">
              Continue your collaborative journey with real-time drawing and AI-powered tools
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span className="button-text">Sign In</span>
                  <span className="button-icon">→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span className="divider-text">or</span>
          </div>

          {/* Social Login - Removed as requested */}
          
          {/* Footer */}
          <div className="auth-footer">
            <p className="footer-text">
              Don't have an account?{" "}
              <Link to="/register" className="footer-link">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side Visual */}
        <div className="auth-visual">
          <div className="visual-content">
            <div className="feature-highlight">
              <div className="feature-icon">🎨</div>
              <h3>Real-time Collaboration</h3>
              <p>Draw together with your team in real-time</p>
            </div>
            
            <div className="feature-highlight">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Tools</h3>
              <p>Advanced machine learning integration</p>
            </div>
            
            <div className="feature-highlight">
              <div className="feature-icon">💾</div>
              <h3>Smart Storage</h3>
              <p>Cloud-based file management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

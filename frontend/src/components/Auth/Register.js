import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/api";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (response.data.token) {
        await login({
          token: response.data.token,
          username: response.data.user?.username || formData.username
        });
        navigate("/home");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
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
          <div className="element element-1">🚀</div>
          <div className="element element-2">⚡</div>
          <div className="element element-3">🎯</div>
          <div className="element element-4">💡</div>
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
              <span className="badge-icon">🎉</span>
              <span className="badge-text">Join Us Today</span>
            </div>
            
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">
              Start your collaborative journey with real-time drawing and AI-powered tools
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
              <label htmlFor="username" className="form-label">
                <span className="label-icon">👤</span>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <span className="label-icon">✅</span>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" className="checkbox-input" required />
                <span className="checkmark"></span>
                I agree to the{" "}
                <Link to="/terms" className="terms-link">Terms of Service</Link>{" "}
                and{" "}
                <Link to="/privacy" className="terms-link">Privacy Policy</Link>
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span className="button-text">Create Account</span>
                  <span className="button-icon">🚀</span>
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
              Already have an account?{" "}
              <Link to="/login" className="footer-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side Visual */}
        <div className="auth-visual">
          <div className="visual-content">
            <div className="feature-highlight">
              <div className="feature-icon">🎨</div>
              <h3>Unlimited Creativity</h3>
              <p>Draw, sketch, and collaborate without limits</p>
            </div>
            
            <div className="feature-highlight">
              <div className="feature-icon">👥</div>
              <h3>Team Collaboration</h3>
              <p>Work together in real-time with your team</p>
            </div>
            
            <div className="feature-highlight">
              <div className="feature-icon">🤖</div>
              <h3>AI Integration</h3>
              <p>Advanced tools powered by machine learning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

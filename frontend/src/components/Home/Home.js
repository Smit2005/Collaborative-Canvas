import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/api";

const Home = () => {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setIsVisible(true);
    
    // Debug authentication state
    console.log("Home component - Current user state:", user);
    console.log("Home component - localStorage token:", localStorage.getItem("user:token"));
    console.log("Home component - localStorage username:", localStorage.getItem("user:username"));
    
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxScroll) * 100;
      setScrollProgress(progress);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [user]);

  const clearForms = () => {
    setRoomName('');
    setRoomId('');
    setRoomInfo(null);
    setError('');
  };

  const switchToCreateTab = () => {
    setActiveTab('create');
    clearForms();
  };

  const switchToJoinTab = () => {
    setActiveTab('join');
    clearForms();
  };

  const createRoom = async () => {
    setError("");
    
    // Check if user is authenticated (try context first, then localStorage as fallback)
    const isAuthenticated = user?.token || localStorage.getItem("user:token");
    const currentUsername = user?.username || localStorage.getItem("user:username");
    
    if (!isAuthenticated) {
      setError("Please login to create a room");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    if (!roomName.trim()) {
      setError("Please enter a room name.");
      return;
    }
    
    try {
      setLoadingCreate(true);
      const res = await api.post("/rooms/create", { name: roomName.trim() });
      
      if (res.data && res.data._id) {
        navigate(`/room/${res.data._id}`);
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error("Create room error:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 403) {
        setError("You don't have permission to create rooms");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to create room. Please try again.");
      }
    } finally {
      setLoadingCreate(false);
    }
  };

  const joinRoom = async () => {
    setError("");
    setRoomInfo(null);
    
    // Check if user is authenticated (try context first, then localStorage as fallback)
    const isAuthenticated = user?.token || localStorage.getItem("user:token");
    const currentUsername = user?.username || localStorage.getItem("user:username");
    
    if (!isAuthenticated) {
      setError("Please login to join a room");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    if (!roomId.trim()) {
      setError("Please enter a room ID.");
      return;
    }
    
    // Validate room ID format (MongoDB ObjectId should be 24 characters)
    const roomIdTrimmed = roomId.trim();
    if (roomIdTrimmed.length !== 24) {
      setError("Invalid room ID format. Room ID should be 24 characters long.");
      return;
    }
    
    try {
      setLoadingJoin(true);
      console.log("Starting join room process for ID:", roomIdTrimmed);
      console.log("Current user:", currentUsername);
      console.log("Auth token exists:", !!localStorage.getItem("user:token"));
      
      // First verify the room exists and get room information
      console.log("Fetching room information...");
      const roomResponse = await api.get(`/rooms/${roomIdTrimmed}`);
      console.log("Room fetch response:", roomResponse.data);
      
      if (roomResponse.data && roomResponse.data._id) {
        const room = roomResponse.data;
        setRoomInfo(room);
        console.log("Room found:", room);
        
        // Send join request to the room
        try {
          console.log("Sending join request...");
          const joinResponse = await api.post(`/rooms/${roomIdTrimmed}/join`);
          console.log("Join room response:", joinResponse.data);
          
          if (joinResponse.data && joinResponse.data._id) {
            // Successfully joined, navigate to room
            console.log("Successfully joined room, navigating to:", `/room/${roomIdTrimmed}`);
            navigate(`/room/${roomIdTrimmed}`);
          } else {
            console.error("Join response missing room data:", joinResponse.data);
            setError("Failed to join room. Please try again.");
          }
        } catch (joinErr) {
          console.error("Join room error:", joinErr);
          console.error("Join room error response:", joinErr.response?.data);
          console.error("Join room error status:", joinErr.response?.status);
          
          if (joinErr.response?.status === 403) {
            setError("Room is full or you don't have permission to join.");
          } else if (joinErr.response?.status === 401) {
            setError("Authentication failed. Please login again.");
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else if (joinErr.response?.data?.message) {
            setError(joinErr.response.data.message);
          } else {
            setError("Failed to join room. Please try again.");
          }
        }
      } else {
        console.error("Room not found in response:", roomResponse.data);
        setError("Room not found. Please check the room ID.");
      }
    } catch (err) {
      console.error("Join room error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 404) {
        setError("Room not found. Please check the room ID.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to join room. Please try again.");
      }
    } finally {
      setLoadingJoin(false);
    }
  };

  const stats = [
    { value: '500+', label: 'Active Users', icon: '👥', color: '#3b82f6' },
    { value: '50+', label: 'Collaboration Rooms', icon: '🚪', color: '#8b5cf6' },
    { value: '1000+', label: 'Sessions Created', icon: '📊', color: '#10b981' },
    { value: '24/7', label: 'Real-time Sync', icon: '⚡', color: '#f59e0b' }
  ];

  const features = [
    {
      icon: '🎨',
      title: 'Real-time Drawing',
      description: 'Collaborate with multiple users simultaneously',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: '📄',
      title: 'Document Annotation',
      description: 'Upload and annotate PDFs/PPTs together',
      gradient: 'from-green-500 to-blue-600'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Tools',
      description: 'Advanced machine learning integration',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: '💾',
      title: 'Version Control',
      description: 'Save and restore different versions',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Enterprise-grade security and privacy',
      gradient: 'from-indigo-500 to-blue-600'
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Works seamlessly on all devices',
      gradient: 'from-pink-500 to-rose-600'
    }
  ];

  const quickActions = [
    {
      icon: '🚀',
      title: 'Start Drawing',
      description: 'Create a new collaboration session',
      action: switchToCreateTab,
      color: '#3b82f6'
    },
    {
      icon: '👥',
      title: 'Join Team',
      description: 'Enter an existing room ID',
      action: switchToJoinTab,
      color: '#8b5cf6'
    },
    {
      icon: '📖',
      title: 'Learn More',
      description: 'Explore our features and capabilities',
      action: () => navigate('/about'),
      color: '#10b981'
    },
    {
      icon: '🎯',
      title: 'View Demo',
      description: 'See the platform in action',
      action: () => navigate('/landing'),
      color: '#f59e0b'
    }
  ];

  return (
    <div className="home-page">
      {/* Custom Cursor */}
      <div 
        ref={cursorRef}
        className="custom-cursor"
        style={{
          left: mousePosition.x,
          top: mousePosition.y
        }}
      />

      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-background">
          <div className="gradient-mesh"></div>
          <div className="floating-elements">
            <div className="element element-1">🎨</div>
            <div className="element element-2">🚀</div>
            <div className="element element-3">⚡</div>
            <div className="element element-4">🤖</div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <div className="badge">
              <span className="badge-icon">🎯</span>
              <span className="badge-text">Welcome to</span>
            </div>
            
            <h1 className="hero-title">
              <span className="title-line">Collaborative Canvas</span>
              <span className="title-line subtitle">Where Ideas Come to Life</span>
            </h1>
            
            <p className="hero-description">
              Transform how you collaborate with our cutting-edge real-time drawing platform. 
              Create, share, and innovate together with AI-powered tools and seamless teamwork.
            </p>
            
            <div className="hero-actions">
              <button 
                onClick={switchToCreateTab}
                className="btn-primary"
              >
                <span className="btn-text">Start Creating</span>
                <span className="btn-icon">🚀</span>
              </button>
              <button 
                onClick={switchToJoinTab}
                className="btn-secondary"
              >
                <span className="btn-text">Join Session</span>
                <span className="btn-icon">👥</span>
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="stat-card"
                  style={{ 
                    '--accent-color': stat.color,
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Room Management Section */}
      <section className="room-section">
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">🚪</span>
              <span className="badge-text">Room Management</span>
            </div>
            <h2>Create or Join a Session</h2>
            <p>Start collaborating in seconds with our intuitive room system</p>
            
            {/* User Status Indicator */}
            {(user?.token || localStorage.getItem("user:token")) ? (
              <div className="user-status">
                <span className="status-icon">✅</span>
                <span className="status-text">
                  Logged in as: {user?.username || localStorage.getItem("user:username")}
                </span>
              </div>
            ) : (
              <div className="user-status not-logged-in">
                <span className="status-icon">⚠️</span>
                <span className="status-text">Please login to create or join rooms</span>
                <button 
                  onClick={() => navigate('/login')}
                  className="login-redirect-btn"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
          
          <div className="room-tabs">
            <div className="tab-container">
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                  onClick={switchToCreateTab}
                >
                  <span className="tab-icon">➕</span>
                  <span className="tab-text">Create Room</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
                  onClick={switchToJoinTab}
                >
                  <span className="tab-icon">🔗</span>
                  <span className="tab-text">Join Room</span>
                </button>
              </div>
              
              <div className="tab-content">
                {activeTab === 'create' ? (
                  <div className="create-room">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon">🏷️</span>
                        Room Name
                      </label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="form-input"
                        placeholder="Enter room name (e.g., Team Meeting)"
                        onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                      />
                    </div>
                    
                    {error && (
                      <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span className="error-text">{error}</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={createRoom}
                      className="submit-button"
                      disabled={loadingCreate}
                    >
                      {loadingCreate ? (
                        <div className="loading-spinner">
                          <div className="spinner"></div>
                          <span>Creating Room...</span>
                        </div>
                      ) : (
                        <>
                          <span className="button-text">Create Room</span>
                          <span className="button-icon">🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="join-room">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-icon">🔑</span>
                        Room ID
                      </label>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="form-input"
                        placeholder="Enter room ID (e.g., abc123)"
                        onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                      />
                    </div>
                    
                    {/* Room Information Display */}
                    {roomInfo && (
                      <div className="room-info">
                        <div className="room-info-header">
                          <span className="info-icon">📋</span>
                          <span className="info-title">Room Information</span>
                        </div>
                        <div className="room-details">
                          <div className="room-detail">
                            <span className="detail-label">Room Name:</span>
                            <span className="detail-value">{roomInfo.name}</span>
                          </div>
                          <div className="room-detail">
                            <span className="detail-label">Room ID:</span>
                            <span className="detail-value">{roomInfo._id}</span>
                          </div>
                          {roomInfo.owner && (
                            <div className="room-detail">
                              <span className="detail-label">Owner:</span>
                              <span className="detail-value">{roomInfo.owner}</span>
                            </div>
                          )}
                          {roomInfo.createdAt && (
                            <div className="room-detail">
                              <span className="detail-label">Created:</span>
                              <span className="detail-value">
                                {new Date(roomInfo.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span className="error-text">{error}</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={joinRoom}
                      className="submit-button"
                      disabled={loadingJoin}
                    >
                      {loadingJoin ? (
                        <div className="loading-spinner">
                          <div className="spinner"></div>
                          <span>Joining Room...</span>
                        </div>
                      ) : (
                        <>
                          <span className="button-text">
                            {roomInfo ? 'Join Room' : 'Find Room'}
                          </span>
                          <span className="button-icon">👥</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">🚀</span>
              <span className="badge-text">Why Choose Us</span>
            </div>
            <h2>Powerful Features for Modern Teams</h2>
            <p>Everything you need to collaborate effectively and bring your ideas to life</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="feature-card"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="feature-header">
                  <div className={`feature-icon bg-gradient-${feature.gradient}`}>
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                </div>
                
                <p className="feature-description">{feature.description}</p>
                
                <div className="feature-decoration">
                  <div className="decoration-line"></div>
                  <div className="decoration-dot"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">Quick Actions</span>
            </div>
            <h2>Get Started in Seconds</h2>
            <p>Choose your path to start collaborating today</p>
          </div>
          
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <div 
                key={action.title}
                className="action-card"
                onClick={action.action}
                style={{ 
                  '--accent-color': action.color,
                  animationDelay: `${index * 150}ms`
                }}
              >
                <div className="action-icon">{action.icon}</div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <div className="action-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-badge">
              <span className="badge-icon">🎯</span>
              <span className="badge-text">Ready to Start?</span>
            </div>
            
            <h2>Transform Your Collaboration Today</h2>
            <p>Join thousands of users who are already collaborating smarter, not harder</p>
            
            <div className="cta-buttons">
              <button 
                onClick={() => setRoomName('')}
                className="btn-primary large"
              >
                <span className="btn-text">Start Free Trial</span>
                <span className="btn-icon">🚀</span>
              </button>
              <button 
                onClick={() => navigate('/about')}
                className="btn-outline"
              >
                <span className="btn-text">Learn More</span>
                <span className="btn-icon">📖</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

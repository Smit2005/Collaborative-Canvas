import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
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
  }, []);

  const features = [
    {
      icon: '🎨',
      title: 'Real-time Collaboration',
      description: 'Draw together in real-time with multiple users',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: '📄',
      title: 'Document Annotation',
      description: 'Upload and annotate PDFs collaboratively',
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

  const stats = [
    { value: '10K+', label: 'Active Users', icon: '👥' },
    { value: '50K+', label: 'Projects Created', icon: '📊' },
    { value: '99.9%', label: 'Uptime', icon: '⚡' },
    { value: '24/7', label: 'Support', icon: '🛟' }
  ];

  const techStack = [
    { name: 'React', icon: '⚛️', color: '#61dafb' },
    { name: 'Node.js', icon: '🟢', color: '#68a063' },
    { name: 'MongoDB', icon: '🍃', color: '#4db33d' },
    { name: 'Python', icon: '🐍', color: '#3776ab' },
    { name: 'Socket.IO', icon: '🔌', color: '#010101' },
    { name: 'Tailwind', icon: '🎨', color: '#06b6d4' }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create or Join Room',
      description: 'Start a new collaboration session or join an existing one',
      icon: '🚪'
    },
    {
      step: '02',
      title: 'Start Collaborating',
      description: 'Draw, annotate, and work together in real-time',
      icon: '✏️'
    },
    {
      step: '03',
      title: 'Save & Share',
      description: 'Save your work and share with team members',
      icon: '💾'
    }
  ];

  return (
    <div className="landing-page">
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
      <section className="landing-hero">
        <div className="hero-background">
          <div className="gradient-mesh"></div>
          <div className="floating-elements">
            <div className="element element-1">⚛️</div>
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
              <Link to="/register" className="btn-primary">
                <span className="btn-text">Get Started Free</span>
                <span className="btn-icon">🚀</span>
              </Link>
              <Link to="/about" className="btn-secondary">
                <span className="btn-text">Learn More</span>
                <span className="btn-icon">📖</span>
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-image">
              <div className="image-container">
                <div className="floating-card card-1">
                  <div className="card-icon">🎨</div>
                  <div className="card-text">Real-time Drawing</div>
                </div>
                <div className="floating-card card-2">
                  <div className="card-icon">👥</div>
                  <div className="card-text">Team Collaboration</div>
                </div>
                <div className="floating-card card-3">
                  <div className="card-icon">🤖</div>
                  <div className="card-text">AI Tools</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="stat-card"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
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

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">📋</span>
              <span className="badge-text">Getting Started</span>
            </div>
            <h2>How It Works</h2>
            <p>Get started in minutes with our simple 3-step process</p>
          </div>
          
          <div className="steps-container">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="step-item">
                <div className="step-marker">
                  <div className="step-number">{step.step}</div>
                  <div className="step-icon">{step.icon}</div>
                </div>
                
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                
                {index < howItWorks.length - 1 && (
                  <div className="step-connector"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="tech-stack-section">
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">Built With</span>
            </div>
            <h2>Modern Technology Stack</h2>
            <p>Built with cutting-edge technologies for optimal performance</p>
          </div>
          
          <div className="tech-grid">
            {techStack.map((tech, index) => (
              <div 
                key={tech.name}
                className="tech-item"
                style={{ 
                  '--tech-color': tech.color,
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="tech-icon">{tech.icon}</div>
                <div className="tech-name">{tech.name}</div>
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
            
            <h2>Join Thousands of Users Today</h2>
            <p>Start collaborating, creating, and innovating with our powerful platform</p>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary large">
                <span className="btn-text">Start Free Trial</span>
                <span className="btn-icon">🚀</span>
              </Link>
              <Link to="/home" className="btn-outline">
                <span className="btn-text">View Demo</span>
                <span className="btn-icon">▶️</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;



import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const About = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRefs = useRef([]);
  const cursorRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxScroll) * 100;
      setScrollProgress(progress);
      
      // Update active section
      const sections = sectionRefs.current;
      sections.forEach((ref, index) => {
        if (ref && ref.offsetTop <= window.scrollY + 200) {
          setActiveSection(index);
        }
      });
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

  const sections = [
    { id: 'overview', title: 'Overview', icon: '🎯' },
    { id: 'architecture', title: 'Architecture', icon: '🏗️' }
  ];

  const stats = [
    { value: '2024', label: 'Project Launched', icon: '📅', color: '#3b82f6' },
    { value: 'MERN', label: 'Tech Stack', icon: '⚛️', color: '#8b5cf6' },
    { value: 'AI/ML', label: 'Python Integration', icon: '🤖', color: '#10b981' },
    { value: 'Real-time', label: 'Collaboration', icon: '🔗', color: '#f59e0b' }
  ];

  // Removed features array and techStack object as requested

  const timeline = [
    {
      phase: 'Phase 1',
      title: 'Research & Planning',
      description: 'Identified collaboration gaps in remote learning',
      icon: '🔍',
      date: 'Jan 2024'
    },
    {
      phase: 'Phase 2',
      title: 'Technology Selection',
      description: 'Chose MERN stack + Python for AI capabilities',
      icon: '⚙️',
      date: 'Feb 2024'
    },
    {
      phase: 'Phase 3',
      title: 'Development',
      description: 'Built core features with real-time collaboration',
      icon: '💻',
      date: 'Mar 2024'
    },
    {
      phase: 'Phase 4',
      title: 'Launch & Iteration',
      description: 'Deployed MVP with continuous improvements',
      icon: '🚀',
      date: 'Apr 2024'
    }
  ];

  return (
    <div className="about-page">
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

      {/* Navigation */}
      <nav className="about-nav">
        <div className="nav-container">
          {sections.map((section, index) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === index ? 'active' : ''}`}
              onClick={() => {
                sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-text">{section.title}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Hero Section - Moved down with more padding */}
      <section className="hero-section" ref={el => sectionRefs.current[0] = el}>
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
              <span className="badge-text">About Our Platform</span>
            </div>
            
            <h1 className="hero-title">
              <span className="title-line">Building the Future of</span>
              <span className="title-line highlight">Collaborative Learning</span>
            </h1>
            
            <p className="hero-description">
              A sophisticated platform that redefines how teams collaborate, 
              combining cutting-edge web technologies with AI innovation to 
              create seamless, intelligent collaboration experiences.
            </p>
            
            <div className="hero-actions">
              <Link to="/register" className="btn-primary">
                <span className="btn-text">Start Building</span>
                <span className="btn-icon">→</span>
              </Link>
              <Link to="/home" className="btn-secondary">
                <span className="btn-text">Explore Platform</span>
                <span className="btn-icon">🔍</span>
              </Link>
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

      {/* Architecture Section - Moved down with more padding */}
      <section className="architecture-section" ref={el => sectionRefs.current[1] = el}>
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">🏗️</span>
              <span className="badge-text">System Architecture</span>
            </div>
            <h2>Scalable & Secure Architecture</h2>
            <p>Professional-grade infrastructure for enterprise deployment</p>
          </div>
          
          <div className="architecture-diagram">
            <div className="diagram-layer frontend">
              <div className="layer-icon">⚛️</div>
              <h3>Frontend Layer</h3>
              <div className="layer-components">
                <span className="component">React App</span>
                <span className="component">PWA</span>
                <span className="component">Canvas Engine</span>
              </div>
            </div>
            
            <div className="diagram-layer api">
              <div className="layer-icon">🔌</div>
              <h3>API Gateway</h3>
              <div className="layer-components">
                <span className="component">Rate Limiting</span>
                <span className="component">Authentication</span>
                <span className="component">Load Balancing</span>
              </div>
            </div>
            
            <div className="diagram-layer services">
              <div className="layer-icon">⚙️</div>
              <h3>Microservices</h3>
              <div className="layer-components">
                <span className="component">Collaboration Service</span>
                <span className="component">AI Service</span>
                <span className="component">File Service</span>
              </div>
            </div>
            
            <div className="diagram-layer data">
              <div className="layer-icon">💾</div>
              <h3>Data Layer</h3>
              <div className="layer-components">
                <span className="component">MongoDB</span>
                <span className="component">Redis Cache</span>
                <span className="component">File Storage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header">
            <div className="header-badge">
              <span className="badge-icon">📅</span>
              <span className="badge-text">Project Journey</span>
            </div>
            <h2>From Concept to Reality</h2>
            <p>The story behind Collaborative Canvas</p>
          </div>
          
          <div className="timeline">
            {timeline.map((item, index) => (
              <div key={item.phase} className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-icon">{item.icon}</div>
                  <div className="marker-number">{index + 1}</div>
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-phase">{item.phase}</span>
                    <span className="timeline-date">{item.date}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
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
            <p>Join the future of intelligent, real-time collaboration</p>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary large">
                <span className="btn-text">Get Started</span>
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

export default About;



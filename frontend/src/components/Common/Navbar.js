import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className="nav">
      <div className="nav-inner container">
        <div className="row">
          <Link to="/" className="brand">
            <img 
              src="/collab-logo.png" 
              alt="CollabCanvas Logo" 
              style={{ 
                width: '35px', 
                height: '35px', 
                marginRight: '8px',
                verticalAlign: 'middle'
              }} 
            />
            CollabCanvas
          </Link>
          <div className="nav-links">
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/home" className="nav-link">Rooms</Link>
          </div>
        </div>
        {user ? (
          <button onClick={logout} className="btn">Logout</button>
        ) : (
          <div className="row">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn" style={{ marginLeft: 8 }}>Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;

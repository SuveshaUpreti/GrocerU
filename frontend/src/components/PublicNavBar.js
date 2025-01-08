import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function PublicNavbar() {
  const navigate = useNavigate();
  return (
    <div className="navbar">
      <nav>
        <div className="logo"><h1>GrocerU</h1></div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/login')}>Log in</button>
          <button onClick={() => navigate('/register')}>Register</button>
        </div>
      </nav>
    </div>
  );
}

export default PublicNavbar;
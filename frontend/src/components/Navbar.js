import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logout from './Logout';

const Navbar = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  return (
    <div className="navbar">
      <nav>
        <div className="logo"><h1>GrocerU</h1></div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/inventory')}>Inventory</button>
          <button onClick={() => navigate('/grocery-list')}>Grocery List</button>
          <button onClick={() => navigate('/recipes')}>Recipes</button>
          <button onClick={() => navigate('/profile')}>Profile</button>
          <Logout setIsLoggedIn={setIsLoggedIn} />
        </div>
      </nav>
    </div>
  );
}

export default Navbar;

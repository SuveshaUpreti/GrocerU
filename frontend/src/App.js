import React from 'react';
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Inventory from './pages/Inventory';
import GroceryList from './pages/GroceryList';
import Recipes from './pages/Recipes';
import Profile from './pages/Profile';
import Register from './components/Register';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import PublicNavBar from './components/PublicNavBar';
import ForgotPwrd from './components/ForgotPwrd';
import ResetPwrd from './components/ResetPwrd';

import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5001/login_status', { withCredentials: true });
        setIsLoggedIn(response.data.logged_in);
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false); // Set loading to false after check
      }
    };

    checkLoginStatus();
  }, []);
  if (isLoading) {
    return <div>Loading...</div>; // Or a custom loading component
  }
  return (
        <div>
          {isLoggedIn ? <Navbar setIsLoggedIn={setIsLoggedIn} /> : <PublicNavBar />} 
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />  {}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} /> 
            <Route path="/forgot-password" element={<ForgotPwrd />} />
            <Route path="/reset_password/:token" element={<ResetPwrd />} />

            {/* Protected Routes */}
            <Route path="/inventory" element={isLoggedIn ? <Inventory /> : <Navigate to="/" />} />
            <Route path="/grocery-list" element={isLoggedIn ? <GroceryList /> : <Navigate to="/" />} />
            <Route path="/recipes" element={isLoggedIn ? <Recipes /> : <Navigate to="/" />} />
            <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/" />} />
            <Route path="/reset_password" element={<ResetPwrd />} />
          </Routes>
        </div>
  );
};
          
export default App;
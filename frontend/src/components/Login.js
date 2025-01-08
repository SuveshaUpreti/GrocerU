import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { login } from '/src/api/grocery-API-calls.js';

const Login = ({ setIsLoggedIn }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Initialize navigate

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle form submission
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            console.log('Form Data:', formData);
            await login(formData); // Call the login function
            setIsLoggedIn(true); // Update login state
            setMessage('Login successful'); // Success message
            navigate('/inventory'); // Navigate to home after successful login
        } catch (error) {
            if (error.message.includes("Too many invalid login attempts")) {
                setMessage("Too many failed attempts. Please try again later.");
            } else {
                setMessage(error.message || 'An error occurred. Please try again.');
            }
        }
    };
    
    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h2>Log in</h2>
                <form onSubmit={handleLogin}>
                    <div>
                        <label>Username</label>
                        <input 
                            type="text" 
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div>
                        <label>Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button type="submit">Log in</button>
                    <div className="forgot-pword">
                        <a href="/forgot-password">Forgot Password?</a>
                    </div>
                </form>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
};

export default Login;
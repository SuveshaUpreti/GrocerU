import React, { useState } from 'react';
import { resetPassword } from '/src/api/grocery-API-calls.js';
import { useLocation } from 'react-router-dom';

const ResetPassword = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await resetPassword(token, newPassword);
            setMessage('Password has been reset successfully.');
        } catch (error) {
            setMessage(error.message || 'Failed to reset password. Please try again.');
        }
    };

    return (
        <div>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>New Password</label>
                    <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ResetPassword;
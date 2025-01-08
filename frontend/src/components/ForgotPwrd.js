import React, { useState } from 'react';
import { SendRecoveryEmail } from '/src/api/grocery-API-calls.js'; // Update this with your actual API function

const ForgotPwrd = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await SendRecoveryEmail(email); // Call your API to send the recovery email
            setMessage('A recovery link has been sent to your email address.');
        } catch (error) {
            setMessage(error.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <div className="forgot-password-container">
            <h2>Forgot Password</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Send Recovery Email</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ForgotPwrd;
import React from 'react';
import { Logout } from '/src/api/grocery-API-calls';

const LogoutButton = ({ setIsLoggedIn }) => {
    const handleLogout = async () => {
        try {
            const response = await Logout();
             if (response.ok) {
                setIsLoggedIn(false);
                console.error('Logout succeeded.');
             } else {
                 console.error('Logout failed.');
             }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
};

export default LogoutButton;
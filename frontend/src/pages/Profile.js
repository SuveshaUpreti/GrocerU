import React, { useEffect, useState } from 'react';

const Profile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedFirstName = localStorage.getItem('first_name');
    const storedLastName = localStorage.getItem('last_name');
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');

    if (storedFirstName) {
      setFirstName(storedFirstName);
    }
    if (storedLastName) {
      setLastName(storedLastName);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  return (
    <div>
      <div className="profile-page">
      <h1>{firstName} {lastName}'s Profile</h1>
      <div className="inventory-table">
        <table className="profile-table">
          <tbody>
            <tr>
              <th scope="row">First Name</th>
              <td>{firstName}</td>
            </tr>
            <tr>
              <th scope="row">Last Name</th>
              <td>{lastName}</td>
            </tr>
            <tr>
              <th scope="row">Username</th>
              <td>{username}</td>
            </tr>
            <tr>
              <th scope="row">E-mail</th>
              <td>{email}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default Profile;
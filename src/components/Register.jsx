import React, { useState } from 'react';

const Register = ({ onSwitchToLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          db_host: dbHost,
          db_port: dbPort,
          db_name: dbName,
          db_user: dbUser,
          db_password: dbPassword,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Registration successful! You can now log in.');
        onSwitchToLogin();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="dbHost" type="text" placeholder="Database Host" value={dbHost} onChange={(e) => setDbHost(e.target.value)} />
          </div>
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="dbPort" type="text" placeholder="Database Port" value={dbPort} onChange={(e) => setDbPort(e.target.value)} />
          </div>
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="dbName" type="text" placeholder="Database Name" value={dbName} onChange={(e) => setDbName(e.target.value)} />
          </div>
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="dbUser" type="text" placeholder="Database User" value={dbUser} onChange={(e) => setDbUser(e.target.value)} />
          </div>
          <div className="mb-6">
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="dbPassword" type="password" placeholder="Database Password" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">Register</button>
            <button className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
        <p className="text-center text-sm mt-4">
          Already have an account? <button onClick={onSwitchToLogin} className="font-bold text-blue-500 hover:text-blue-800">Login</button>
        </p>
      </div>
    </div>
  );
};

export default Register;

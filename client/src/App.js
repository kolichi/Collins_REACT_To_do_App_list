import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthPage } from './components/AuthPage';
import { TodoWrapper } from './components/TodoWrapper';
import axios from "axios";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token validity
          await axios.get('/api/todos', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsLoggedIn(true);
        }
      } catch (err) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    };
    verifyAuth();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <TodoWrapper onLogout={handleLogout} />
      ) : (
        <AuthPage onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;
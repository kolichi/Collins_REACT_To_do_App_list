import React, { useState } from "react";
import { AuthForm } from "./AuthForm";
import axios from "axios";

export const AuthPage = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleAuthSubmit = async (credentials) => {
    try {
      setError('');
      const url = isSignup 
      ? 'http://localhost:5000/api/signup' 
      : 'http://localhost:5000/api/login';
      const response = await axios.post(url, credentials);
      
      if (!response.data.token) {
        throw new Error('No token received');
      }
      
      localStorage.setItem('token', response.data.token);
      onLogin();
      
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const errorMessage = serverMessage || err.message || 'Authentication failed';
      setError(errorMessage);
      console.error('Auth error:', err.response?.data || err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <AuthForm
          type={isSignup ? "signup" : "login"}
          onSubmit={handleAuthSubmit}
          error={error}
        />
        <div className="auth-footer">
          <button
            type="button"
            className="toggle-button"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

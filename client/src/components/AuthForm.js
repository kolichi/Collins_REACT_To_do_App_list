import React, { useState } from "react";
import logo from '../logo.png'; 


export const AuthForm = ({ type, onSubmit, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <div className="auth-container">
      <h2>{type === "signup" ? "Sign Up" : "Login"}</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="logo-container">
        <img src={logo} alt="Todo App Logo" className="todo-logo" />
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {type === "signup" ? "Create Account" : "Login"}
        </button>
      </form>
    </div>
  );
};

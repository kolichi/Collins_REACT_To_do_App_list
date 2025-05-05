import React, { useState } from 'react';
import logo from '../logo.png'; 

export const TodoForm = ({ addTodo }) => {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addTodo(value);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="TodoForm">
      <div className="logo-container">
        <img src={logo} alt="Todo App Logo" className="todo-logo" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="todo-input"
        placeholder="What is the task today?"
        disabled={submitting}
      />
      <button 
        type="submit" 
        className="todo-btn"
        disabled={submitting}
      >
        {submitting ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  );
};

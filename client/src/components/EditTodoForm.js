import React, { useState } from 'react';

export const EditTodoForm = ({ editTodo, task }) => {
  const [value, setValue] = useState(task.task);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;  // Add validation
    setIsLoading(true);
    try {
      await editTodo(task.id, value);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="TodoForm">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="todo-input"
        placeholder="Update task"
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="todo-btn"
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Update Task'}
      </button>
    </form>
  );
};
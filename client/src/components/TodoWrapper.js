import React, { useState, useEffect } from "react";
import { Todo } from "./Todo";
import { TodoForm } from "./TodoForm";
import { EditTodoForm } from "./EditTodoForm";
import axios from "axios";

export const TodoWrapper = ({ onLogout }) => {
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Configure axios once
  axios.defaults.baseURL = "http://localhost:5000";

  useEffect(() => {
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${localStorage.getItem("token")}`;
    fetchTodos();
  }, []);


  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/todos");
      setTodos(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load tasks. Please refresh the page.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todoText) => {
    if (!todoText.trim()) {
      setError("Task cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/todos", { task: todoText });
      setTodos([...todos, response.data]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add task");
      console.error("Add error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`/api/todos/${id}`);
      setTodos(todos.filter((todo) => todo.id !== id));
      setError("");
    } catch (err) {
      setError("Failed to delete task");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id) => {
    try {
      setLoading(true);
      const todo = todos.find((t) => t.id === id);
      const response = await axios.put(`/api/todos/${id}`, {
        task: todo.task,
        completed: !todo.completed,
      });
      setTodos(todos.map((t) => (t.id === id ? response.data : t)));
      setError("");
    } catch (err) {
      setError("Failed to update task status");
      console.error("Toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  const editTodo = async (id, newTask) => {
    if (!newTask.trim()) {
      setError("Task cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`/api/todos/${id}`, {
        task: newTask,
        completed: todos.find((t) => t.id === id).completed,
      });

      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...response.data, isEditing: false } : todo
        )
      );
      setError("");
    } catch (err) {
      setError("Failed to update task");
      console.error("Edit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="TodoWrapper">
      <h1>Bridging Gap Solutions</h1>
      <button onClick={onLogout} className="logout-btn">
        Logout
      </button>
      <TodoForm addTodo={addTodo} />

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Loading tasks...</div>}

      {todos.map((todo) =>
        todo.isEditing ? (
          <EditTodoForm key={todo.id} editTodo={editTodo} task={todo} />
        ) : (
          <Todo
            key={todo.id}
            task={todo}
            toggleComplete={toggleComplete}
            deleteTodo={deleteTodo}
            editTodo={(id) =>
              setTodos(
                todos.map((t) => (t.id === id ? { ...t, isEditing: true } : t))
              )
            }
          />
        )
      )}
    </div>
  );
};

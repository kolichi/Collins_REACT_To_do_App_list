import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

export const Todo = ({ task, deleteTodo, editTodo, toggleComplete }) => {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTodo(task.id);
    }
  };

  return (
    <div className="Todo">
      <p
        className={`${task.completed ? "completed" : "incompleted"}`}
        onClick={() => toggleComplete(task.id)}
      >
        {task.task}
      </p>
      <div>
        <FontAwesomeIcon
          className="edit-icon"
          icon={faPenToSquare}
          onClick={() => editTodo(task.id)}
          aria-label="Edit"
        />
        <FontAwesomeIcon
          className="delete-icon"
          icon={faTrash}
          onClick={handleDelete}  
          aria-label="Delete"
        />
      </div>
    </div>
  );
};
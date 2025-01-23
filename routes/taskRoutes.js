const express = require("express");
const mySqlPool = require("../config/db");
const router = express.Router();

// Access to the io object to emit messages to all connected clients
let io;

// POST route to create a task
router.post("/tasks", async (req, res) => {
  const { name, status = "Pending" } = req.body; // Default status to 'Pending'

  try {
    const query = "INSERT INTO tasks (name, status) VALUES (?, ?)";
    const [result] = await mySqlPool.execute(query, [name, status]);

    // Emit task creation notification to all clients
    io.emit("taskCreated", {
      message: "Task created successfully",
      taskId: result.insertId,
      name,
      status,
      created_at: new Date().toISOString(),
    });

    res
      .status(201)
      .json({ message: "Task created successfully", taskId: result.insertId });
  } catch (err) {
    console.error("Error inserting task:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// GET route to retrieve all tasks
router.get("/tasks", async (req, res) => {
  const query = "SELECT * FROM tasks";
  try {
    const [results] = await mySqlPool.execute(query);
    res.status(200).json(results); // Send the fetched tasks
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET route to retrieve a specific task by ID
router.get("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const query = "SELECT * FROM tasks WHERE id = ?";
  try {
    const [results] = await mySqlPool.execute(query, [taskId]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT route to update a task
router.put("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const { name, status } = req.body;

  const query = "UPDATE tasks SET name = ?, status = ? WHERE id = ?";
  try {
    const [result] = await mySqlPool.execute(query, [name, status, taskId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Emit task update notification to all clients
    io.emit("taskUpdated", {
      message: "Task updated successfully",
      id: taskId,
      name,
      status,
      created_at: new Date().toISOString(),
    });

    res.status(200).json({
      id: taskId,
      name,
      status,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE route to delete a task
router.delete("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;

  const query = "DELETE FROM tasks WHERE id = ?";
  try {
    const [result] = await mySqlPool.execute(query, [taskId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Emit task deletion notification to all clients
    io.emit("taskDeleted", {
      message: "Task deleted successfully",
      taskId,
    });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Set io for emitting events
router.setIo = (socketIo) => {
  io = socketIo;
};

module.exports = router;

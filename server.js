const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const mySqlPool = require("./config/db");
const http = require("http");
const socketIo = require("socket.io");
const taskRouter = require("./routes/taskRoutes");

// configure dotenv
dotenv.config();

// Create a rest object
const app = express();

// Create HTTP server and integrate socket.io with it
const server = http.createServer(app);
const corsOptions = {
  origin: "https://lively-scone-aaa416.netlify.app", // React app's URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true, // Allow cookies and other credentials
};

app.use(cors(corsOptions));

const io = socketIo(server, {
  cors: {
    origin: "https://lively-scone-aaa416.netlify.app", // React app's URL
    methods: ["POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(express.json());
// middleware
app.use(morgan("dev"));

// Test route
app.get("/test", (req, res) => {
  res.status(200).send("<h1>Nodejs mysql first app</h1>");
});

// Pass the io object to the taskRouter
taskRouter.setIo(io);

// Routes
app.use("/api", taskRouter);

// WebSocket connection
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("message", (data) => {
    console.log("Message from client:", data);
    socket.emit("response", { message: "Message received" });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// MySQL connection and server listen
mySqlPool
  .query("SELECT 1")
  .then(() => {
    console.log("Connected to MySQL database".bgCyan.white);
    // Start the server with socket.io integrated
    server.listen(process.env.PORT, () => {
      console.log(
        `Server running on port http://localhost:${process.env.PORT}`.bgMagenta
          .white
      );
    });
  })
  .catch((error) => {
    console.log("MySQL connection failed:", error);
  });

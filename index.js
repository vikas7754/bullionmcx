const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { io: ClientIO } = require("socket.io-client");

const TARGET_WS_URL = "https://south.starlinebullion.in:10004";
const PORT = 8080;

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (clientSocket) => {
  console.log("Client connected:", clientSocket.id);

  // Connect to the actual WebSocket server
  const targetSocket = ClientIO(TARGET_WS_URL, {
    transports: ["websocket"],
  });
  let prjName = "radhikajewellers";

  targetSocket.on("connect", () => {
    targetSocket.emit("client", prjName);
  });

  targetSocket.on("refProduct", (data) => {
    clientSocket.emit("message", data);
  });

  // Handle disconnections
  clientSocket.on("disconnect", () => {
    console.log("Client disconnected:", clientSocket.id);
    targetSocket.disconnect();
  });

  targetSocket.on("disconnect", () => {
    console.log("Target WebSocket disconnected");
  });

  targetSocket.on("error", (err) =>
    console.error("Target WebSocket error:", err)
  );
  clientSocket.on("error", (err) =>
    console.error("Client WebSocket error:", err)
  );
});

// Start the proxy server
server.listen(PORT, () => {
  console.log(`WebSocket Proxy Server running on http://localhost:${PORT}`);
});

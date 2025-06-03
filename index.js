const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { io: ClientIO } = require("socket.io-client");
const zlib = require("zlib");
const path = require("path");

const TARGET_WS_URL = "http://dashboard.ambicaaspot.com:10001";
// const TARGET_WS_URL = "https://b2.starlinedashboard.in:10001";
const PORT = 8080;

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, "html")));

const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: { origin: "*" },
});

// Example data format
// {
//     "symbol": "gold",
//     "Name": "GOLD04APR25FUT",
//     "Bid": 84900,
//     "Ask": 84920,
//     "High": 85279,
//     "Low": 84433,
//     "Open": 84653,
//     "Close": 84444,
//     "LTP": 84915,
//     "Difference": 471,
//     "Time": "11:54:39 PM"
// }

io.on("connection", (clientSocket) => {
  console.log("Client connected:", clientSocket.id);

  // Connect to the actual WebSocket server
  const targetSocket = ClientIO(TARGET_WS_URL, {
    transports: ["websocket"],
  });
  let prjName = "lawatjewellers";

  targetSocket.on("connect", () => {
    console.log("Target WebSocket connected");
    targetSocket.emit("room", prjName);
  });

  targetSocket.on("Liverate", (data) => {
    //    const parsedData = data.map(JSON.parse);
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

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { io: ClientIO } = require("socket.io-client");
const path = require("path");
const getPrices = require("./getPrice");

const TARGET_WS_URL = "https://starlinebuild.in:10001";
const PORT = 8080;
const POLL_INTERVAL = 2000; // HTTP poll interval (ms)
const RETRY_INTERVAL = 30000; // Retry HTTP after fallback (ms)
const PRJ_NAME = "lawatjewellers";

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "html")));

app.get("/", (req, res) => {
  res.send("Welcome to server");
});

app.post("/api/prices", async (req, res) => {
  try {
    const select = req.body?.select;
    const prices = await getPrices();
    const filteredPrices = select
      ? prices.filter((p) => select.includes(p.symbol))
      : prices;
    res.json(filteredPrices);
  } catch (err) {
    console.error("HTTP API error:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// --- Shared price source (single connection for all clients) ---
let latestPrices = null;
let source = "none"; // "http" | "ws" | "none"
let targetSocket = null;
let pollTimer = null;
let retryTimer = null;

function broadcast(data) {
  latestPrices = data;
  io.emit("message", data);
}

// --- HTTP API (primary) ---
async function pollHttp() {
  try {
    const prices = await getPrices();
    broadcast(prices);

    // If we were on WS fallback, switch back to HTTP
    if (source !== "http") {
      console.log("HTTP API recovered — switching back from WebSocket");
      disconnectWebSocket();
      clearInterval(retryTimer);
      retryTimer = null;
      source = "http";
      startHttpPolling();
    }
  } catch (err) {
    console.error("HTTP API error:", err.message);

    // First failure — switch to WebSocket fallback
    if (source === "http" || source === "none") {
      console.log("HTTP API failed — falling back to WebSocket");
      stopHttpPolling();
      source = "ws";
      connectWebSocket();

      // Periodically retry HTTP to check recovery
      if (!retryTimer) {
        retryTimer = setInterval(pollHttp, RETRY_INTERVAL);
      }
    }
  }
}

function startHttpPolling() {
  stopHttpPolling();
  pollTimer = setInterval(pollHttp, POLL_INTERVAL);
}

function stopHttpPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// --- WebSocket (fallback) ---
function connectWebSocket() {
  if (targetSocket) return; // already connected

  targetSocket = ClientIO(TARGET_WS_URL, { transports: ["websocket"] });

  targetSocket.on("connect", () => {
    console.log("WebSocket fallback connected");
    targetSocket.emit("room", PRJ_NAME);
  });

  targetSocket.on("Liverate", (data) => {
    if (source === "ws") broadcast(data);
  });

  targetSocket.on("disconnect", () => {
    console.log("WebSocket fallback disconnected");
  });

  targetSocket.on("error", (err) => {
    console.error("WebSocket fallback error:", err.message);
  });
}

function disconnectWebSocket() {
  if (targetSocket) {
    targetSocket.disconnect();
    targetSocket = null;
  }
}

// --- Client connections ---
io.on("connection", (clientSocket) => {
  console.log("Client connected:", clientSocket.id);

  // Send latest cached prices immediately so the client doesn't wait
  if (latestPrices) {
    clientSocket.emit("message", latestPrices);
  }

  clientSocket.on("disconnect", () => {
    console.log("Client disconnected:", clientSocket.id);
  });

  clientSocket.on("error", (err) => {
    console.error("Client socket error:", err.message);
  });
});

// --- Bootstrap ---
// Kick off with an immediate HTTP attempt, then start polling
pollHttp().then(() => {
  if (source !== "ws") {
    source = "http";
    startHttpPolling();
  }
});

server.listen(PORT, () => {
  console.log(`WebSocket Proxy Server running on http://localhost:${PORT}`);
});

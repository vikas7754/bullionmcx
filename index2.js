const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { io: ClientIO } = require("socket.io-client");
const zlib = require("zlib");
const getPrices = require("./getPrices");

const TARGET_WS_URL = "https://b2.starlinedashboard.in:10001";
const PORT = 8080;

const app = express();
app.use(cors());

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

  let XAGUSD;
  let XAUUSD;

  // // Connect to the Radhika WebSocket server
  // const targetSocket = ClientIO(TARGET_WS_URL, {
  //   transports: ["websocket"],
  // });
  // let prjName = "radhika";

  // targetSocket.on("connect", () => {
  //   console.log("Target WebSocket connected");
  //   targetSocket.emit("client", prjName);
  // });

  // targetSocket.on("referanceProducts", (data) => {
  //   const decompressed = zlib.inflateSync(data);
  //   const json = JSON.parse(decompressed.toString());
  //   const gold_spot = json.find((data) => data.Name === "XAUUSD");
  //   console.log(gold_spot);
  // });

  getPrices()
    .then((prices) => {
      clientSocket.emit("message", prices);
    })
    .catch((error) => {
      console.error("Error fetching prices:", error);
    });

  setInterval(async () => {
    try {
      const prices = await getPrices();
      clientSocket.emit("message", prices);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }, 10000);

  // Handle disconnections
  clientSocket.on("disconnect", () => {
    console.log("Client disconnected:", clientSocket.id);
  });

  clientSocket.on("error", (err) =>
    console.error("Client WebSocket error:", err)
  );

  // targetSocket.on("disconnect", () => {
  //   console.log("Target WebSocket disconnected");
  // });

  // targetSocket.on("error", (err) =>
  //   console.error("Target WebSocket error:", err)
  // );
});

// Start the proxy server
server.listen(PORT, () => {
  console.log(`WebSocket Proxy Server running on http://localhost:${PORT}`);
});

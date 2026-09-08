
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// One active visitor at a time.
// A heartbeat keeps the lock alive; disconnect releases it.
let activeSocketId = null;
let lastHeartbeat = 0;
const LOCK_TIMEOUT = 15000;

app.use(express.static(__dirname));

function isLocked() {
  if (!activeSocketId) return false;
  if (Date.now() - lastHeartbeat > LOCK_TIMEOUT) {
    activeSocketId = null;
    lastHeartbeat = 0;
    return false;
  }
  return true;
}

setInterval(() => {
  if (activeSocketId && Date.now() - lastHeartbeat > LOCK_TIMEOUT) {
    activeSocketId = null;
    lastHeartbeat = 0;
    io.emit("site-available");
  }
}, 3000);

io.on("connection", (socket) => {
  if (!isLocked()) {
    activeSocketId = socket.id;
    lastHeartbeat = Date.now();
    socket.emit("access-granted");
  } else {
    socket.emit("access-denied");
  }

  socket.on("heartbeat", () => {
    if (socket.id === activeSocketId) lastHeartbeat = Date.now();
  });

  socket.on("release-access", () => {
    if (socket.id === activeSocketId) {
      activeSocketId = null;
      lastHeartbeat = 0;
      io.emit("site-available");
    }
  });

  socket.on("disconnect", () => {
    if (socket.id === activeSocketId) {
      activeSocketId = null;
      lastHeartbeat = 0;
      io.emit("site-available");
    }
  });
});

server.listen(PORT, () => {
  console.log(`White Page is running on port ${PORT}`);
});

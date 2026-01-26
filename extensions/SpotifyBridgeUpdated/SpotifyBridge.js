
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const AUTH = "higithub";
const WS_PORT = 9444;
const HTTP_PORT = 4391;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let latest = {};
let spotifySocket = null;

// ---------- Security ----------
app.get("/status", (_req, res) => res.json(latest));

// --- Auth middleware ---
app.use((req, res, next) => {
  const openPaths = ["/", "/status"]; // no token needed for these
  if (openPaths.includes(req.path) || req.path.startsWith("/static/")) {
    return next();
  }
  if (req.query.auth === AUTH) return next();
  res.status(403).json({ error: "Forbidden" });
});

// ---------- Serve dashboard ----------
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

// ---------- Socket from Spotify ----------
io.on("connection", (socket) => {
  console.log("Spotify connected");
  spotifySocket = socket;

  socket.on("message", (msg) => {
    try { latest = JSON.parse(msg); } catch {}
  });
  socket.on("disconnect", () => (spotifySocket = null));
});

// ---------- Basic commands ----------
// ---------- Command routes ----------
app.get("/command/playpause", sendCmd("playpause"));
app.get("/command/next", sendCmd("next"));
app.get("/command/previous", sendCmd("previous"));
app.get("/command/repeatmode", sendCmd("repeatmode"));
app.get("/command/shuffle", sendCmd("shuffle"));
app.get("/command/mute", sendCmd("mute"));
app.get("/command/unmute", sendCmd("unmute"));

// ---------- Explicit seek ----------
app.get("/command/seek/:seconds", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  const sec = Number(req.params.seconds);
  if (Number.isNaN(sec)) return res.status(400).json({ error: "Invalid seconds" });
  spotifySocket.emit("bridgeCommand", { cmd: "seek", seconds: sec });
  console.log("Seek →", sec);
  res.json({ ok: true, type: "seek", value: sec });
});

// ---------- Explicit volume ----------
app.get("/command/volume/:level", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  const lvl = Number(req.params.level);
  if (Number.isNaN(lvl)) return res.status(400).json({ error: "Invalid volume" });
  spotifySocket.emit("bridgeCommand", { cmd: "setvolume", level: lvl });
  console.log("Volume →", lvl);
  res.json({ ok: true, type: "volume", value: lvl });
});

// ---------- Shuffle + repeat ----------
app.get("/command/shuffle", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  const newState = latest.shuffle ? "Disabled" : "Enabled";
  spotifySocket.emit("bridgeCommand", { cmd: "shuffle" });
  console.log("Shuffle toggled:", newState);
  latest.shuffle = !latest.shuffle;
  res.json({ ok: true, type: "shuffle", value: newState });
});

app.get("/command/repeatmode", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  const nextState =
    latest.repeatMode === "off" ? "Context" :
    latest.repeatMode === "Context" ? "Track" : "Off";
  spotifySocket.emit("bridgeCommand", { cmd: "repeatmode" });
  console.log("Repeat →", nextState);
  latest.repeatMode = nextState;
  res.json({ ok: true, type: "repeatmode", value: nextState });
});

// ---------- Basic playback ----------
app.get("/command/playpause", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  const state = latest.isPlaying ? "Paused" : "Playing";
  spotifySocket.emit("bridgeCommand", { cmd: "playpause" });
  latest.isPlaying = !latest.isPlaying;
  console.log("Play/Pause →", state);
  res.json({ ok: true, type: "playpause", value: state });
});

app.get("/command/next", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  spotifySocket.emit("bridgeCommand", { cmd: "next" });
  console.log("Next Track");
  res.json({ ok: true, type: "next", value: "Next Track" });
});

app.get("/command/previous", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  spotifySocket.emit("bridgeCommand", { cmd: "previous" });
  console.log("Previous Track");
  res.json({ ok: true, type: "previous", value: "Previous Track" });
});

// ---------- Volume up/down ----------
app.get("/command/volup", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  latest.volume = Math.min((latest.volume || 50) + 10, 100);
  spotifySocket.emit("bridgeCommand", { cmd: "volup" });
  console.log("Volume Up →", latest.volume);
  res.json({ ok: true, type: "volume", value: latest.volume });
});

app.get("/command/voldown", (req, res) => {
  if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
  latest.volume = Math.max((latest.volume || 50) - 10, 0);
  spotifySocket.emit("bridgeCommand", { cmd: "voldown" });
  console.log("Volume Down →", latest.volume);
  res.json({ ok: true, type: "volume", value: latest.volume });
});


// helper to avoid repetition
function sendCmd(cmd) {
  return (_req, res) => {
    if (!spotifySocket) return res.status(400).json({ error: "No Spotify connected" });
    spotifySocket.emit("bridgeCommand", { cmd });
    console.log("Sent:", cmd);
    res.json({ ok: true });
  };
}


// ---------- Start servers ----------
server.listen(WS_PORT, () =>
  console.log(`WS listening ws://localhost:${WS_PORT}`)
);
app.listen(HTTP_PORT, () =>
  console.log(`HTTP dashboard http://localhost:${HTTP_PORT}/?auth=${AUTH}`)
);

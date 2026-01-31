// ==UserScript==
// @name         Spicetify Playback API
// @description  Sends playback data + receives bridge commands (volume, seek, shuffle, etc.)
// ==/UserScript==

(async function playbackAPI() {
  if (!window.io) {
    const s = document.createElement("script");
    s.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    document.head.appendChild(s);
    await new Promise((r) => (s.onload = r));
  }

  const socket = io("http://127.0.0.1:9443", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    pingInterval: 5000,
    pingTimeout: 10000,
  });

  socket.on("connect", () => {
    console.log("[PlaybackAPI] Connected to bridge");
    sendPlayback(true);
  });

  socket.on("disconnect", () => {
    console.warn("[PlaybackAPI] Bridge disconnected");
  });

  async function waitForPlayer() {
    for (let i = 0; i < 200; i++) {
      if (window.Spicetify?.Player) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  }

  const ok = await waitForPlayer();
  if (!ok) {
    console.error("[PlaybackAPI] Spicetify.Player not found (timeout)");
    return;
  }

  function buildPayload() {
    const p = Spicetify.Player;
    const item = p?.data?.item?.metadata || {};

    let cover =
      item.image_xlarge_url ||
      item.image_large_url ||
      item.image_url ||
      "";

    if (typeof cover === "string" && cover.startsWith("spotify:image:")) {
      const hash = cover.split(":").pop();
      cover = `https://i.scdn.co/image/${hash}`;
    }

    return {
      artist: item.artist_name || "",
      title: item.title || "",
      album: item.album_title || "",
      progress: Math.round((p.getProgress?.() || 0) / 1000),
      duration: Math.round((p.getDuration?.() || 0) / 1000),
      isPlaying: !!p.isPlaying?.(),
      shuffle: !!p.getShuffle?.(),
      repeatMode: p.getRepeat?.() ?? 0,
      volume: Math.round(((p.getVolume?.() ?? 0) * 100)),
      muted: (p.getVolume?.() ?? 0) === 0,
      cover: cover || ""
    };
  }

  let lastPayloadJSON = "";
  let lastSendAt = 0;

  function sendPlayback(force = false) {
    try {
      if (!socket.connected) return;

      const payload = buildPayload();
      const json = JSON.stringify(payload);

      if (!force && json === lastPayloadJSON) return;

      lastPayloadJSON = json;
      lastSendAt = Date.now();

      socket.emit("playback", payload);
      socket.send(json);
    } catch (err) {
      console.error("[PlaybackAPI] Send error:", err);
    }
  }

  try {
    Spicetify.Player.addEventListener("songchange", () => sendPlayback(true));
    Spicetify.Player.addEventListener("onplaypause", () => sendPlayback(true));
    Spicetify.Player.addEventListener("onprogress", () => sendPlayback(false));
  } catch (e) {
    console.warn(
      "[PlaybackAPI] Player events not available, relying on heartbeat.",
      e
    );
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) sendPlayback(true);
  });

  window.addEventListener("focus", () => sendPlayback(true));

  function createHeartbeatWorker(interval = 1500) {
    const blob = new Blob(
      [`
        let timer = null;
        self.onmessage = (e) => {
          if (e.data === "start") {
            if (timer) return;
            timer = setInterval(() => {
              self.postMessage("tick");
            }, ${interval});
          }
          if (e.data === "stop") {
            clearInterval(timer);
            timer = null;
          }
        };
      `],
      { type: "application/javascript" }
    );

    return new Worker(URL.createObjectURL(blob));
  }

  const heartbeatWorker = createHeartbeatWorker(1500);

  heartbeatWorker.onmessage = () => {
    const stale = Date.now() - lastSendAt > 4000;
    sendPlayback(stale);
  };

  heartbeatWorker.postMessage("start");

  socket.on("bridgeCommand", (data) => {
    const cmd = typeof data === "string" ? data : data.cmd;
    const val = data?.level ?? data?.seconds ?? null;
    const p = Spicetify.Player;

    try {
      switch (cmd) {
        case "playpause": p.togglePlay(); break;
        case "next": p.next(); break;
        case "previous": p.back(); break;
        case "repeatmode": p.toggleRepeat(); break;
        case "shuffle": p.toggleShuffle(); break;
        case "seek":
          if (val != null) p.seek(val * 1000);
          break;
        case "setvolume":
          if (val != null) p.setVolume(Math.min(Math.max(val / 100, 0), 1));
          break;
        case "volup":
          p.setVolume(Math.min(p.getVolume() + 0.1, 1));
          break;
        case "voldown":
          p.setVolume(Math.max(p.getVolume() - 0.1, 0));
          break;
        case "mute":
          p.setVolume(0);
          break;
        case "unmute":
          p.setVolume(0.5);
          break;
      }

      sendPlayback(true);
    } catch (err) {
      console.error("[PlaybackAPI] Cmd error:", err);
    }
  });

  sendPlayback(true);
})();

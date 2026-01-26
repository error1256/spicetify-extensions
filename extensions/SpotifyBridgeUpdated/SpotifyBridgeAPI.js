// ==UserScript==
// @name         Spotify Bridge API Updated 
// @description  Sends data + receives bridge commands (volume, seek, shuffle, etc.)
// ==/UserScript==

(async function playbackAPI() {
  if (!window.io) {
    const s = document.createElement("script");
    s.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    document.head.appendChild(s);
    await new Promise(r => s.onload = r);
  }

  const socket = io("http://127.0.0.1:9443", {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
  });

  socket.on("connect", () => console.log("[PlaybackAPI] Connected to bridge"));
  socket.on("disconnect", () => console.warn("[PlaybackAPI] Bridge disconnected"));

  // --- Send playback data every second ---
  setInterval(() => {
    try {
      const p = Spicetify.Player;
      const item = p.data?.item?.metadata || {};

      let cover = item.image_xlarge_url || item.image_large_url || item.image_url || "";
      if (cover.startsWith("spotify:image:")) {
        const hash = cover.split(":").pop();
        cover = `https://i.scdn.co/image/${hash}`;
      }
      if (!cover && item.album_uri) {
        const albumId = item.album_uri.split(":").pop();
        cover = `https://i.scdn.co/image/${albumId}`;
      }

      socket.send(JSON.stringify({
        artist: item.artist_name || "",
        title: item.title || "",
        album: item.album_title || "",
        progress: Math.round(p.getProgress() / 1000),
        duration: Math.round(p.getDuration() / 1000),
        isPlaying: p.isPlaying(),
        shuffle: p.getShuffle(),
        repeatMode: p.getRepeat(),
        volume: Math.round(p.getVolume() * 100),
        muted: p.getVolume() === 0,
        cover: cover
      }));
    } catch (err) {
      console.error("[PlaybackAPI] Send error:", err);
    }
  }, 1000);

  socket.on("bridgeCommand", (data) => {
    const cmd = typeof data === "string" ? data : data.cmd;
    const val = data.level ?? data.seconds ?? null;
    const p = Spicetify.Player;
    try {
      switch (cmd) {
        case "playpause": p.togglePlay(); break;
        case "next": p.next(); break;
        case "previous": p.back(); break;
        case "repeatmode": p.toggleRepeat(); break;
        case "shuffle": p.toggleShuffle(); break;
        case "seek": if (val != null) p.seek(val * 1000); break;
        case "setvolume": p.setVolume(Math.min(Math.max(val / 100, 0), 1)); break;
        case "volup": p.setVolume(Math.min(p.getVolume() + 0.1, 1)); break;
        case "voldown": p.setVolume(Math.max(p.getVolume() - 0.1, 0)); break;
        case "mute": p.setVolume(0); break;
        case "unmute": p.setVolume(0.5); break;
      }
    } catch (err) {
      console.error("[PlaybackAPI] Cmd error:", err);
    }
  });
})();

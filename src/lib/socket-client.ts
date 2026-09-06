import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/supabase-client";
import { resolveApiBaseUrl } from "@/lib/api-client";

const SOCKET_URL = resolveApiBaseUrl().replace(/\/api\/v1\/?$/, "");

let socket: Socket | null = null;
let connectingPromise: Promise<Socket> | null = null;

/**
 * Socket.IO singleton untuk chat + notifikasi real-time.
 *
 * Heartbeat dikelola Engine.IO di sisi server (`pingInterval` / `pingTimeout`).
 * Client otomatis membalas ping; jika timeout, koneksi putus lalu reconnect.
 *
 * Panggil `connectSocket()` setelah login, `disconnectSocket()` saat logout.
 */
export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (connectingPromise) return connectingPromise;

  // Buang instance lama yang sedang reconnect dengan token basi
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  connectingPromise = (async () => {
    const token = await getAccessToken();

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      // Selaras dengan server: utamakan WebSocket murni
      transports: ["websocket", "polling"],
      // Reconnect setelah putus (termasuk karena ping timeout)
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      // Timeout handshake awal (ms)
      timeout: 20_000,
    });

    // Setiap percobaan reconnect: kirim access token terbaru
    newSocket.io.on("reconnect_attempt", async () => {
      const latest = await getAccessToken();
      if (newSocket) {
        newSocket.auth = { token: latest };
      }
    });

    newSocket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.info("[socket] connected", newSocket?.id);
      }
    });

    newSocket.on("disconnect", (reason) => {
      // reason: io client disconnect | io server disconnect | ping timeout |
      //         transport close | transport error | ...
      console.info("[socket] disconnect", reason);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("[socket] connect_error:", err.message);
    });

    newSocket.on("session:replaced", () => {
      console.info("[socket] session replaced by another tab/device");
    });

    socket = newSocket;
    return newSocket;
  })();

  try {
    return await connectingPromise;
  } finally {
    connectingPromise = null;
  }
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.io.removeAllListeners();
  socket.disconnect();
  socket = null;
  connectingPromise = null;
}

export function getSocket(): Socket | null {
  return socket;
}
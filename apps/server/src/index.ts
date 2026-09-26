import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { randomInt, randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import {
  createGame,
  move,
  viewFor,
  choicesFor,
  type Game,
  type Mode,
} from "../../../packages/core/src/index";
import { GuestIdentity, type Guest } from "./guest";

type Seat = {
  id: string;
  name: string;
  ready: boolean;
  away: boolean;
  online: boolean;
  bot: boolean;
};
type Room = {
  code: string;
  host: string;
  capacity: number;
  mode: Mode;
  seats: Seat[];
  game: Game | null;
  revision: number;
  touched: number;
  chat: { name: string; text: string; id: string }[];
  notice: string;
};
type Client = {
  socket: WebSocket;
  guest: Guest | null;
  alive: boolean;
  count: number;
  window: number;
  seen: Map<string, object>;
};
const identity = new GuestIdentity(),
  rooms = new Map<string, Room>(),
  clients = new Map<string, Client>();
const root = resolve(
  fileURLToPath(new URL("../../web/dist/", import.meta.url)),
);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url!, "http://localhost").pathname,
    );
    let path = resolve(root, "." + pathname);
    if (!path.startsWith(root + sep) && path !== root) throw Error();
    if (!extname(path)) path = resolve(root, "index.html");
    if (!(await stat(path)).isFile()) throw Error();
    res.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; frame-ancestors 'none'",
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end(
      "Not found. Run npm run build, or open http://localhost:5173 in development.",
    );
  }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 8192 });
server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin;
  let valid = false;
  try {
    const url = new URL(origin ?? "");
    valid =
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      ["http:", "https:"].includes(url.protocol);
  } catch {}
  if (!valid || req.url !== "/ws") {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});
function send(c: Client, data: object) {
  if (c.socket.readyState === WebSocket.OPEN)
    c.socket.send(JSON.stringify(data));
}
function paused(r: Room) {
  return (
    !!r.game &&
    !r.game.result &&
    r.seats.some((s) => !s.bot && (!s.online || s.away))
  );
}
function broadcast(r: Room) {
  for (const s of r.seats) {
    const c = clients.get(s.id);
    if (c)
      send(c, {
        type: "state",
        room: {
          code: r.code,
          host: r.host,
          capacity: r.capacity,
          mode: r.mode,
          seats: r.seats,
          revision: r.revision,
          paused: paused(r),
          chat: r.chat,
          notice: r.notice,
          game: r.game ? viewFor(r.game, s.id) : null,
        },
      });
  }
}
function changed(r: Room) {
  r.revision++;
  r.touched = Date.now();
  broadcast(r);
}
function leave(g: Guest) {
  const r = rooms.get(g.room ?? "");
  g.room = null;
  if (!r) return;
  const departing = r.seats.find((s) => s.id === g.id);
  r.seats = r.seats.filter((s) => s.id !== g.id);
  if (!r.seats.some((s) => !s.bot)) {
    rooms.delete(r.code);
    return;
  }
  if (r.game) {
    r.game = null;
    r.seats.forEach((s) => (s.ready = s.bot));
    r.notice = `${departing?.name ?? "一名玩家"} 已离开。本局已中止，重新准备后可开始。`;
  }
  if (r.host === g.id)
    r.host = (r.seats.find((s) => s.online && !s.bot) ??
      r.seats.find((s) => !s.bot))!.id;
  changed(r);
}
function requireRoom(g: Guest) {
  const r = rooms.get(g.room ?? "");
  if (!r) throw Error("房间已关闭，请重新创建或加入");
  return r;
}
function command(c: Client, m: any) {
  if (!m || typeof m !== "object" || Array.isArray(m)) throw Error("无效消息");
  if (m.type === "hello") {
    if (c.guest) throw Error("已经连接");
    const g = identity.resolve(m.token, m.name),
      old = clients.get(g.id);
    c.guest = g;
    clients.set(g.id, c);
    if (old && old !== c) old.socket.close(4001, "Session opened elsewhere");
    send(c, { type: "identity", id: g.id, token: g.token, name: g.name });
    const r = rooms.get(g.room ?? "");
    if (r) {
      const s = r.seats.find((s) => s.id === g.id)!;
      s.online = true;
      changed(r);
    } else {
      g.room = null;
      send(c, { type: "state", room: null });
    }
    return;
  }
  const g = c.guest;
  if (!g) throw Error("请先连接");
  g.seen = Date.now();
  if (m.type === "create" || m.type === "join") {
    if (g.room) throw Error("请先离开当前房间");
    g.name = identity.name(m.name);
    let r: Room;
    if (m.type === "create") {
      if (rooms.size >= 100) throw Error("房间已满，请稍后再试");
      if (
        ![3, 4, 5, 6].includes(m.capacity) ||
        !["basic", "advanced"].includes(m.mode)
      )
        throw Error("房间设置无效");
      let code;
      do {
        code = String(randomInt(100000, 1000000));
      } while (rooms.has(code));
      r = {
        code,
        host: g.id,
        capacity: m.capacity,
        mode: m.mode,
        seats: [],
        game: null,
        revision: 0,
        touched: Date.now(),
        chat: [],
        notice: "",
      };
      rooms.set(code, r);
    } else {
      const code = String(m.code ?? "").trim();
      const found = rooms.get(code);
      if (!found) throw Error("没有找到这个房间，请检查六位房间号");
      r = found;
      if (r.game) throw Error("这间教室正在对局，请等待结束");
      if (r.seats.length >= r.capacity) throw Error("房间已满");
    }
    r.seats.push({
      id: g.id,
      name: g.name,
      ready: false,
      away: false,
      online: true,
      bot: false,
    });
    g.room = r.code;
    changed(r);
    return;
  }
  if (m.type === "leave") {
    leave(g);
    send(c, { type: "state", room: null });
    return;
  }
  const r = requireRoom(g),
    seat = r.seats.find((s) => s.id === g.id)!;
  if (m.type === "ready") {
    if (r.game) throw Error("本局尚未返回准备室");
    seat.ready = !seat.ready;
    changed(r);
  } else if (m.type === "away") {
    seat.away = !seat.away;
    if (seat.away) seat.ready = false;
    changed(r);
  } else if (m.type === "chat") {
    if (typeof m.text !== "string") throw Error("消息为空");
    const text = m.text
      .replace(/[\p{Cc}\p{Cf}]/gu, "")
      .trim()
      .slice(0, 280);
    if (!text) return;
    r.chat.push({ id: randomUUID(), name: g.name, text });
    r.chat = r.chat.slice(-50);
    changed(r);
  } else if (m.type === "bots") {
    if (r.host !== g.id || r.game) throw Error("只有房主能在准备室添加练习席");
    while (r.seats.length < r.capacity) {
      const n = r.seats.length;
      r.seats.push({
        id: randomUUID(),
        name: ["", "雾枝", "冬青", "白露", "晚汐", "月见"][n],
        ready: true,
        away: false,
        online: true,
        bot: true,
      });
    }
    changed(r);
  } else if (m.type === "remove-bots") {
    if (r.host !== g.id || r.game) throw Error("仅房主可移除练习席");
    r.seats = r.seats.filter((s) => !s.bot);
    changed(r);
  } else if (m.type === "start") {
    if (r.host !== g.id || r.game) throw Error("只有房主可以开始");
    if (
      r.seats.length !== r.capacity ||
      r.seats.some((s) => !s.ready || !s.online || s.away)
    )
      throw Error("请等待所有席位入座并准备");
    r.game = createGame(r.seats, r.mode);
    r.notice = "";
    changed(r);
  } else if (m.type === "abort") {
    if (r.host !== g.id || !r.game || !paused(r))
      throw Error("只有房主能在暂停时结束本局");
    r.game = null;
    r.seats.forEach((s) => (s.ready = s.bot));
    r.notice = "房主结束了暂停的对局，请重新准备。";
    changed(r);
  } else if (m.type === "rematch") {
    if (r.host !== g.id || !r.game?.result)
      throw Error("结算后由房主返回准备室");
    r.game = null;
    r.seats.forEach((s) => (s.ready = s.bot));
    changed(r);
  } else if (m.type === "move") {
    if (!r.game || paused(r) || seat.away)
      throw Error("对局已暂停，等待所有玩家回来");
    if (m.revision !== r.revision) throw Error("牌桌已更新，请重新选择");
    if (!m.action || typeof m.action !== "object") throw Error("无效行动");
    r.game = move(r.game, g.id, m.action);
    changed(r);
  } else throw Error("未知操作");
}
wss.on("connection", (socket) => {
  const c: Client = {
    socket,
    guest: null,
    alive: true,
    count: 0,
    window: Date.now(),
    seen: new Map(),
  };
  const authTimer = setTimeout(() => {
    if (!c.guest) socket.close(4000, "Hello timeout");
  }, 10000);
  socket.on("pong", () => {
    c.alive = true;
  });
  socket.on("message", (raw) => {
    let id: string | undefined;
    try {
      if (Date.now() - c.window > 10000) {
        c.window = Date.now();
        c.count = 0;
      }
      if (++c.count > 100) throw Error("操作太快，请稍等");
      const m = JSON.parse(raw.toString());
      id = typeof m?.id === "string" ? m.id.slice(0, 80) : undefined;
      if (id && c.seen.has(id)) {
        send(c, c.seen.get(id)!);
        return;
      }
      command(c, m);
      const ack = { type: "ack", id };
      if (id) {
        c.seen.set(id, ack);
        if (c.seen.size > 100) c.seen.delete(c.seen.keys().next().value!);
      }
      send(c, ack);
    } catch (e) {
      send(c, {
        type: "error",
        id,
        message: e instanceof Error ? e.message : "操作失败",
      });
    }
  });
  socket.on("error", () => {});
  socket.on("close", () => {
    clearTimeout(authTimer);
    const g = c.guest;
    if (!g || clients.get(g.id) !== c) return;
    clients.delete(g.id);
    g.seen = Date.now();
    const r = rooms.get(g.room ?? "");
    if (!r) return;
    const s = r.seats.find((s) => s.id === g.id);
    if (s) {
      s.online = false;
      s.ready = false;
    }
    changed(r);
  });
});
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    const c = [...clients.values()].find((c) => c.socket === ws);
    if (!c) continue;
    if (!c.alive) {
      ws.terminate();
      continue;
    }
    c.alive = false;
    ws.ping();
  }
  for (const r of rooms.values()) {
    const host = r.seats.find((s) => s.id === r.host);
    if (host && !host.online && Date.now() - r.touched > 60000) {
      const next = r.seats.find((s) => s.online && !s.bot);
      if (next) {
        r.host = next.id;
        changed(r);
      }
    }
    if (
      !r.seats.some((s) => !s.bot && s.online) &&
      Date.now() - r.touched > 1800000
    )
      rooms.delete(r.code);
  }
  identity.prune();
}, 15000);
const bots = setInterval(() => {
  for (const r of rooms.values()) {
    if (!r.game || r.game.result || paused(r)) continue;
    for (const s of r.seats.filter((s) => s.bot)) {
      const choices = choicesFor(r.game, s.id);
      if (!choices.length) continue;
      const simple = choices.filter((c) => c.action.type === "embalm");
      const pool = simple.length && Math.random() < 0.65 ? simple : choices;
      r.game = move(r.game, s.id, pool[randomInt(pool.length)].action);
      changed(r);
      break;
    }
  }
}, 1100);
const port = Number(process.env.PORT ?? 3001);
server.listen(port, "127.0.0.1", () =>
  console.log(`Embalming Girl · http://localhost:${port}`),
);
function shutdown() {
  clearInterval(heartbeat);
  clearInterval(bots);
  for (const ws of wss.clients) ws.close(1001, "Server stopping");
  wss.close();
  server.close();
  setTimeout(() => process.exit(), 1000).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

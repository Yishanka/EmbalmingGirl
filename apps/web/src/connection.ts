import { useEffect, useRef, useState } from "react";
import type { GameView, Mode } from "../../../packages/core/src/index";
export type RoomView = {
  code: string;
  host: string;
  capacity: number;
  mode: Mode;
  revision: number;
  paused: boolean;
  notice: string;
  seats: {
    id: string;
    name: string;
    ready: boolean;
    away: boolean;
    online: boolean;
    bot: boolean;
  }[];
  chat: { id: string; name: string; text: string }[];
  game: GameView | null;
};
export function useConnection() {
  const [room, setRoom] = useState<RoomView | null>(null),
    [pid, setPid] = useState(""),
    [status, setStatus] = useState("connecting"),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const socket = useRef<WebSocket | null>(null),
    request = useRef<{
      id: string;
      timer: ReturnType<typeof setTimeout>;
    } | null>(null),
    reconnect = useRef(() => {});
  useEffect(() => {
    let disposed = false,
      timer: ReturnType<typeof setTimeout>,
      attempt = 0,
      blocked = false;
    const clear = () => {
      if (request.current) clearTimeout(request.current.timer);
      request.current = null;
      setPending(false);
    };
    function connect() {
      if (disposed) return;
      setStatus("connecting");
      const ws = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`,
      );
      socket.current = ws;
      const helloTimeout = setTimeout(() => ws.close(), 10000);
      ws.onopen = () =>
        ws.send(
          JSON.stringify({
            type: "hello",
            token: sessionStorage.getItem("eg-token"),
            name: localStorage.getItem("eg-name") || "无名来客",
          }),
        );
      ws.onmessage = (e) => {
        if (socket.current !== ws) return;
        let m;
        try {
          m = JSON.parse(e.data);
        } catch {
          return;
        }
        if (m.type === "identity") {
          clearTimeout(helloTimeout);
          sessionStorage.setItem("eg-token", m.token);
          setPid(m.id);
          setStatus("connected");
          setError("");
          attempt = 0;
        }
        if (m.type === "state") setRoom(m.room);
        if (m.type === "error") {
          setError(m.message);
          if (!m.id) ws.close();
        }
        if (
          m.id === request.current?.id &&
          (m.type === "ack" || m.type === "error")
        )
          clear();
      };
      ws.onclose = (e) => {
        clearTimeout(helloTimeout);
        if (disposed || socket.current !== ws) return;
        clear();
        if (e.code === 4001) {
          blocked = true;
          setStatus("replaced");
          setError("这个席位已在另一窗口打开。请在那边继续，或以新访客进入。");
          return;
        }
        setStatus("disconnected");
        timer = setTimeout(connect, Math.min(1000 * 2 ** attempt++, 10000));
      };
      ws.onerror = () => ws.close();
    }
    reconnect.current = () => {
      clearTimeout(timer);
      if (blocked) {
        sessionStorage.removeItem("eg-token");
        setRoom(null);
        blocked = false;
      }
      socket.current?.close();
      connect();
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      clear();
      socket.current?.close();
    };
  }, []);
  function send(type: string, data: Record<string, unknown> = {}) {
    if (
      status !== "connected" ||
      socket.current?.readyState !== WebSocket.OPEN
    ) {
      setError("连接尚未恢复，请稍候");
      return false;
    }
    if (request.current) return false;
    const id = crypto.randomUUID();
    setPending(true);
    setError("");
    request.current = {
      id,
      timer: setTimeout(() => {
        request.current = null;
        setPending(false);
        setError("未收到确认，正在重新连接以核对牌桌状态。");
        socket.current?.close();
      }, 8000),
    };
    socket.current.send(JSON.stringify({ type, id, ...data }));
    return true;
  }
  return {
    room,
    pid,
    status,
    error,
    pending,
    send,
    clearError: () => setError(""),
    reconnect: () => reconnect.current(),
  };
}

export type Send = (type: string, data?: Record<string, unknown>) => boolean;

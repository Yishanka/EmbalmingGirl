import { useEffect, useRef, useState } from "react";
import type { RoomView, Send } from "./connection";
export default function Waiting({
  room: r,
  pid,
  send,
  disabled,
  copy,
  leave,
}: {
  room: RoomView;
  pid: string;
  send: Send;
  disabled: boolean;
  copy: () => void;
  leave: () => void;
}) {
  const me = r.seats.find((s) => s.id === pid)!,
    host = r.host === pid,
    canStart =
      r.seats.length === r.capacity &&
      r.seats.every((s) => s.ready && s.online && !s.away);
  return (
    <main className="waiting">
      <div className="waiting-scene" />
      <section className="waiting-intro">
        <div className="eyebrow">THE WAITING ROOM</div>
        <h1>
          门已合上。
          <br />
          等她们到来。
        </h1>
        <p>
          有些秘密，
          <br />
          只有坐在同一张桌前才会知晓。
        </p>
        <div className="room-code">
          <span>教室编号</span>
          <strong>{r.code}</strong>
          <button onClick={copy}>复制邀请 ↗</button>
        </div>
        <div className="pill">
          {r.mode === "basic" ? "基础规则" : "进阶规则"} · {r.capacity} 人 ·
          调和目标 {12 - r.capacity} MP
        </div>
        <button className="text-button" onClick={leave}>
          ← 离开教室
        </button>
      </section>
      <section className="waiting-content">
        <div className="section-head">
          <h2>今晚的同行者</h2>
          <span className="muted">
            {r.seats.length} / {r.capacity} 已入座
          </span>
        </div>
        {r.notice && <p className="notice">{r.notice}</p>}
        <div className="seat-grid">
          {Array.from({ length: r.capacity }, (_, i) => {
            const s = r.seats[i];
            return (
              <div key={i} className={`waiting-seat ${s ? "occupied" : ""}`}>
                <span className="seat-no">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="avatar">{s ? s.name[0] : "+"}</div>
                <strong>
                  {s ? s.name : "虚位以待"} {s?.id === pid && <small>你</small>}
                </strong>
                <span className={`seat-status ${s?.ready ? "ready" : ""}`}>
                  {!s
                    ? "等待同行者"
                    : s.away
                      ? "暂离"
                      : !s.online
                        ? "连接中断"
                        : s.bot
                          ? "练习席 · 已准备"
                          : s.ready
                            ? "已准备"
                            : "尚未准备"}
                </span>
                {s?.id === r.host && <span className="host-label">房主</span>}
              </div>
            );
          })}
        </div>
        <div className="waiting-actions">
          <button
            className={me.ready ? "" : "primary"}
            disabled={disabled || me.away}
            onClick={() => send("ready")}
          >
            {me.ready ? "取消准备" : "我准备好了"} <span>✓</span>
          </button>
          {host && (
            <button
              className="primary"
              disabled={disabled || !canStart}
              onClick={() => send("start")}
            >
              开始这场长夜 →
            </button>
          )}
          <button disabled={disabled} onClick={() => send("away")}>
            {me.away ? "回到座位" : "暂离"}
          </button>
        </div>
        <p className="muted center">
          {canStart
            ? "所有人已准备，由房主开始。"
            : "所有席位入座并准备后，由房主开始。"}
        </p>
        {host && (
          <div className="practice-row">
            <span>想先熟悉牌桌？</span>
            <button
              className="text-button"
              disabled={disabled}
              onClick={() =>
                send(r.seats.some((s) => s.bot) ? "remove-bots" : "bots")
              }
            >
              {r.seats.some((s) => s.bot) ? "移除练习席" : "用练习席补齐空位"} ↗
            </button>
          </div>
        )}
        <Chat room={r} send={send} disabled={disabled} />
      </section>
    </main>
  );
}
export function Chat({
  room,
  send,
  disabled,
}: {
  room: RoomView;
  send: Send;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [room.chat.length]);
  return (
    <div className="chat">
      <div className="eyebrow">低声交谈</div>
      <div className="chat-messages" aria-live="polite">
        {room.chat.length ? (
          room.chat.map((m) => (
            <p key={m.id}>
              <b>{m.name}</b>
              {m.text}
            </p>
          ))
        ) : (
          <p className="muted">可以分享线索，也可以保守秘密。</p>
        )}
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim() && send("chat", { text })) setText("");
        }}
      >
        <input
          aria-label="聊天消息"
          placeholder="说点什么…"
          maxLength={280}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button aria-label="发送消息" disabled={disabled || !text.trim()}>
          ↑
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  cards,
  actionKey,
  type Choice,
  type GameView,
} from "../../../packages/core/src/index";
import type { RoomView, Send } from "./connection";
import { Modal, CardFace } from "./components";
import { Chat } from "./Waiting";
const phaseText: Record<string, string> = {
  nurse: "回收一张已打出的牌",
  "nurse-discard": "先弃一张手牌，支付回收代价",
  prefect: "选择要调查的玩家",
  leader: "选择交换对象",
  exchange: "双方秘密选牌，提交后同时交换",
  lady: "选择要抽取的手牌",
  "lady-give": "选择一张手牌交还对方",
  home: "选择手牌与调和牌交换",
  accomplice: "把一张质疑牌转移到另一人面前",
  draw: "感染者：先取回一张调和牌",
  pass: "新闻部：秘密选择传给下一位的牌",
  declare: "优等生调查：请秘密回应",
};
export default function Board({
  room: r,
  pid,
  send,
  disabled,
  art,
  copy,
  leave,
}: {
  room: RoomView;
  pid: string;
  send: Send;
  disabled: boolean;
  art: boolean;
  copy: () => void;
  leave: () => void;
}) {
  const g = r.game!,
    me = r.seats.find((s) => s.id === pid)!;
  const [abortOpen, setAbortOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null),
    [action, setAction] = useState("embalm"),
    [choice, setChoice] = useState(""),
    [side, setSide] = useState("log"),
    [reveal, setReveal] = useState(false);
  const handKey = g.hand.map((c) => c.id).join(",");
  useEffect(() => {
    setSelected(null);
    setChoice("");
  }, [handKey, g.phase?.kind, g.turn]);
  const ownTurn = g.turn === pid,
    canAct = g.choices.length > 0 && !r.paused && !disabled;
  const selectedCard = g.hand.find((c) => c.id === selected);
  const phaseChoices =
    selected && g.choices.some((c) => c.action.card === selected)
      ? g.choices.filter((c) => c.action.card === selected)
      : g.choices;
  const candidates = g.phase
    ? phaseChoices
    : g.choices.filter(
        (c) => c.action.card === selected && c.action.type === action,
      );
  const picked =
    candidates.find((c) => actionKey(c.action) === choice) ??
    (candidates.length === 1 ? candidates[0] : null);
  function commit(c: Choice) {
    if (send("move", { action: c.action, revision: r.revision })) {
      setChoice("");
      setSelected(null);
    }
  }
  const turnName = r.seats.find((s) => s.id === g.turn)?.name;
  return (
    <main className="board-page">
      <div className="board-toolbar">
        <div>
          <span className="eyebrow">旧校舍</span>
          <button className="room-tag" onClick={copy}>
            NO. {r.code} ↗
          </button>
          <span className="mode-tag">
            {r.mode === "basic" ? "基础" : "进阶"} · {r.capacity} 人
          </span>
        </div>
        <div>
          <button
            className="text-button"
            disabled={disabled}
            onClick={() => send("away")}
          >
            {me.away ? "返回牌桌" : "暂离"}
          </button>
          {r.paused && r.host === pid && (
            <button className="text-button" onClick={() => setAbortOpen(true)}>
              结束本局
            </button>
          )}
          <button className="text-button" onClick={leave}>
            离开
          </button>
        </div>
      </div>
      <div className="board-layout">
        <section className="play-area">
          <div className="opponents">
            {g.players
              .filter((p) => p.id !== pid)
              .map((p, i) => {
                const s = r.seats.find((s) => s.id === p.id)!;
                return (
                  <div
                    className={`player ${p.id === g.turn ? "current" : ""}`}
                    key={p.id}
                  >
                    <div className="player-heading">
                      <div className="avatar small-avatar">{p.name[0]}</div>
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {s.bot
                            ? "练习席"
                            : s.away
                              ? "暂离"
                              : !s.online
                                ? "掉线"
                                : p.locked
                                  ? "身份已锁定"
                                  : p.id === g.turn
                                    ? "正在行动"
                                    : "静候中"}
                        </small>
                      </div>
                      <span className="seat-no">0{i + 1}</span>
                    </div>
                    <div className="mini-hand">
                      {Array.from({ length: p.count }, (_, i) => (
                        <i key={i} />
                      ))}
                      <span>{p.count} 张</span>
                    </div>
                    <div className="suspicion">
                      <span>质疑</span>
                      <b>{p.suspicion}</b>
                      <small>张</small>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="table">
            <div className="table-label">
              <span>ST. LILY ACADEMY</span>
              <i>✧</i>
              <span>KEEP YOUR SECRET</span>
            </div>
            <div className="table-zones">
              <div className="embalming-zone">
                <span className="eyebrow">EMBALMING / 调和</span>
                <div className="sealed-stack">
                  {g.embalming.length ? (
                    Array.from(
                      { length: Math.min(g.embalming.length, 5) },
                      (_, i) => (
                        <div
                          key={i}
                          className="card-back"
                          style={{
                            transform: `translateX(${(i - 2) * 12}px) rotate(${(i - 2) * 6}deg)`,
                          }}
                        >
                          <span>✧</span>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="empty-card">
                      <span>✧</span>
                    </div>
                  )}
                </div>
                <strong>
                  {g.embalming.length}
                  <small> 张调和牌</small>
                </strong>
                <p>
                  目标 <b>{12 - r.capacity} MP</b> <span>· 点数在终局揭晓</span>
                </p>
              </div>
              <div className="table-divider" />
              <div className="discard-zone">
                <span className="eyebrow">MEMORY / 打出牌</span>
                <div className="discard-display">
                  {g.discarded.length ? (
                    <CardFace
                      small
                      art={art}
                      card={g.discarded[g.discarded.length - 1]}
                      onClick={() => setReveal(true)}
                    />
                  ) : (
                    <div className="empty-card">
                      <span>⌁</span>
                    </div>
                  )}
                </div>
                <button className="text-button" onClick={() => setReveal(true)}>
                  查看全部 {g.discarded.length} 张 ↗
                </button>
              </div>
            </div>
            <div className="table-caption">
              她仍沉睡着。你们之中，有人知道真相。
            </div>
          </div>
          <div
            className={`turn-banner ${ownTurn ? "your-turn" : ""}`}
            aria-live="polite"
          >
            <span className="turn-light" />
            <strong>
              {g.result
                ? "长夜结束"
                : r.paused
                  ? "牌桌已暂停"
                  : g.phase
                    ? phaseText[g.phase.kind]
                    : ownTurn
                      ? "轮到你了"
                      : `${turnName} 的回合`}
            </strong>
            <span>
              {r.paused
                ? "等待暂离或断线的同行者返回"
                : g.result
                  ? "所有身份已揭晓"
                  : g.phase
                    ? g.choices.length
                      ? "完成下方选择"
                      : "等待其他玩家回应"
                    : "每回合选择一张牌，执行一种行动"}
            </span>
            <small>第 {String(g.round).padStart(2, "0")} 轮</small>
          </div>
          <section className="hand-section">
            <div className="section-head">
              <div>
                <strong>你的手牌</strong>
                <span className="muted"> {g.hand.length} 张 · 仅你可见</span>
              </div>
              <span className="self-suspicion">
                收到质疑 {g.players.find((p) => p.id === pid)?.suspicion} 张
              </span>
            </div>
            <div className={`hand ${me.away ? "concealed" : ""}`}>
              {me.away ? (
                <div className="away-hand">
                  <b>你的手牌已收起</b>
                  <button onClick={() => send("away")} disabled={disabled}>
                    我回来了
                  </button>
                </div>
              ) : (
                g.hand.map((c) => (
                  <CardFace
                    key={c.id}
                    card={c}
                    art={art}
                    selected={selected === c.id}
                    onClick={() => {
                      setSelected(c.id);
                      setChoice("");
                    }}
                  />
                ))
              )}
            </div>
            {!me.away && (
              <div className="action-panel">
                {g.phase ? (
                  <>
                    <div className="action-description">
                      <strong>{phaseText[g.phase.kind]}</strong>
                      <span>
                        {g.choices.length
                          ? "选择后提交；其他人看不到你的秘密选择。"
                          : "你的选择已提交，或此阶段由其他玩家处理。"}
                      </span>
                    </div>
                    {g.choices.length > 0 && (
                      <div className="resolve-controls">
                        <select
                          aria-label="能力选择"
                          value={picked ? actionKey(picked.action) : ""}
                          onChange={(e) => setChoice(e.target.value)}
                        >
                          <option value="" disabled>
                            请选择…
                          </option>
                          {candidates.map((c) => (
                            <option
                              key={actionKey(c.action)}
                              value={actionKey(c.action)}
                            >
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="primary"
                          disabled={!canAct || !picked}
                          onClick={() => picked && commit(picked)}
                        >
                          确认选择 →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="action-description">
                      <strong>
                        {selectedCard
                          ? cards[selectedCard.role].name
                          : g.hand.length === 1
                            ? "这就是你的身份"
                            : "选择一张手牌"}
                      </strong>
                      <span>
                        {selectedCard
                          ? cards[selectedCard.role].ability
                          : g.hand.length === 1
                            ? "静候最终揭晓，仍可参与讨论。"
                            : "调和、质疑，或发动它的能力。"}
                      </span>
                    </div>
                    <div className="action-controls">
                      <div className="action-tabs">
                        {[
                          ["embalm", "调和"],
                          ["suspect", "质疑"],
                          ["play", "能力"],
                        ].map(([key, label]) => (
                          <button
                            key={key}
                            className={action === key ? "chosen" : ""}
                            onClick={() => {
                              setAction(key);
                              setChoice("");
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {action === "suspect" && (
                        <select
                          aria-label="质疑对象"
                          value={picked ? actionKey(picked.action) : ""}
                          onChange={(e) => setChoice(e.target.value)}
                        >
                          <option value="" disabled>
                            选择对象
                          </option>
                          {candidates.map((c) => (
                            <option
                              key={actionKey(c.action)}
                              value={actionKey(c.action)}
                            >
                              {
                                r.seats.find((s) => s.id === c.action.target)
                                  ?.name
                              }
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        className="primary"
                        disabled={!canAct || !picked}
                        onClick={() => picked && commit(picked)}
                      >
                        {ownTurn ? "确认行动" : "等待回合"} →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </section>
        <aside className="board-sidebar">
          <div className="sidebar-heading">
            <span className="eyebrow">长夜记录</span>
            <span>✧</span>
          </div>
          <div className="tabs">
            <button
              className={side === "log" ? "active" : ""}
              onClick={() => setSide("log")}
            >
              桌上动静
            </button>
            <button
              className={side === "notes" ? "active" : ""}
              onClick={() => setSide("notes")}
            >
              秘密线索{g.notes.length > 0 && ` · ${g.notes.length}`}
            </button>
          </div>
          <div className="log" aria-live="polite">
            {side === "log" ? (
              [...g.log].reverse().map((text, i) => (
                <div key={`${g.log.length - i}-${text}`}>
                  <small>{String(g.log.length - i).padStart(2, "0")}</small>
                  <p>{text}</p>
                </div>
              ))
            ) : me.away ? (
              <p className="muted">返回座位后查看秘密线索。</p>
            ) : g.notes.length ? (
              g.notes.map((text, i) => (
                <div key={i}>
                  <small>◇</small>
                  <p>{text}</p>
                </div>
              ))
            ) : (
              <p className="muted">
                这里会记录只有你知道的事。调查快照不会随牌的移动而更新。
              </p>
            )}
          </div>
          <Chat room={r} send={send} disabled={disabled} />
          <div className="sidebar-note">保持沉默也是一种回答。</div>
        </aside>
      </div>
      {abortOpen && (
        <Modal title="结束当前对局？" close={() => setAbortOpen(false)}>
          <p>
            本局不会计入胜负。所有人返回准备室，可以等同行者回来后重新开始。
          </p>
          <div className="button-row">
            <button onClick={() => setAbortOpen(false)}>继续等候</button>
            <button
              className="danger"
              disabled={disabled}
              onClick={() => {
                send("abort");
                setAbortOpen(false);
              }}
            >
              结束并返回准备室
            </button>
          </div>
        </Modal>
      )}
      {reveal && (
        <Modal title="已经说出口的秘密" close={() => setReveal(false)}>
          <div className="card-gallery">
            {g.discarded.length ? (
              g.discarded.map((c) => <CardFace key={c.id} card={c} art={art} />)
            ) : (
              <p className="muted">还没有打出的牌。</p>
            )}
          </div>
        </Modal>
      )}
      {g.result && (
        <Result
          game={g}
          room={r}
          pid={pid}
          art={art}
          send={send}
          disabled={disabled}
        />
      )}
    </main>
  );
}
function Result({
  game: g,
  room: r,
  pid,
  art,
  send,
  disabled,
}: {
  game: GameView;
  room: RoomView;
  pid: string;
  art: boolean;
  send: Send;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(true),
    result = g.result!;
  return open ? (
    <Modal title="天亮之后，真相留下。" close={() => setOpen(false)}>
      <div className="result-intro">
        <span className="eyebrow">THE REVEAL</span>
        <h3>
          {result.winners.includes(pid)
            ? "你走出了这场长夜。"
            : "秘密终于有了答案。"}
        </h3>
        <p>{result.reason}</p>
        <div className="result-score">
          <b>
            {result.points} <small>/ {result.threshold} MP</small>
          </b>
          <span>
            {result.points >= result.threshold ? "调和成功" : "调和失败"}
          </span>
        </div>
      </div>
      <div className="result-players">
        {g.players.map((p) => (
          <div
            key={p.id}
            className={result.winners.includes(p.id) ? "winner" : ""}
          >
            {p.identity && <CardFace small card={p.identity} art={art} />}
            <strong>
              {p.name}
              {p.id === pid ? " · 你" : ""}
            </strong>
            <span>
              {result.winners.includes(p.id) ? "胜者" : "未胜出"} ·{" "}
              {result.jailed.includes(p.id) ? "被监禁" : "未被监禁"}
            </span>
            <small>质疑点数 {result.suspicion[p.id]}</small>
          </div>
        ))}
      </div>
      <details>
        <summary>查看全部调和牌</summary>
        <p>
          {g.embalming
            .map((c) => ("role" in c ? cards[c.role].name : ""))
            .join("、") || "没有调和牌"}
        </p>
      </details>
      <div className="button-row">
        <button onClick={() => setOpen(false)}>回看牌桌</button>
        {r.host === pid ? (
          <button
            className="primary"
            disabled={disabled}
            onClick={() => send("rematch")}
          >
            返回准备室 · 再来一局 →
          </button>
        ) : (
          <span className="muted">等待房主返回准备室</span>
        )}
      </div>
    </Modal>
  ) : (
    <button className="result-reopen primary" onClick={() => setOpen(true)}>
      查看终局结算 ↗
    </button>
  );
}

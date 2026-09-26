import { useEffect, useRef, useState, type ReactNode } from "react";
import { cards, type Card, type Role } from "../../../packages/core/src/index";
const roles = Object.keys(cards) as Role[];
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-inner">
        <div className="section-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="关闭" onClick={close}>
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function CardFace({
  card,
  selected,
  onClick,
  art = false,
  small = false,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  art?: boolean;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false),
    c = cards[card.role];
  return (
    <button
      type="button"
      className={`card ${selected ? "selected" : ""} ${small ? "small" : ""} ${c.priority < 4 ? "ominous" : ""}`}
      onClick={onClick}
      aria-pressed={onClick ? !!selected : undefined}
      aria-label={`${c.name}，${c.point} 点。${c.ability}`}
    >
      {art && !failed ? (
        <img
          className="card-art"
          src={`/cards/${card.role}.webp`}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <div className="card-corners">
            <b>{c.point}</b>
            <span>MP</span>
          </div>
          <div className="card-ornament">
            <span>{c.symbol}</span>
          </div>
          <span className="card-seal">聖 莉 莉</span>
        </>
      )}
      <div className="card-caption">
        <strong>{c.name}</strong>
        <span>
          {c.win} · 顺位 {c.priority}
        </span>
      </div>
    </button>
  );
}
export function Rules() {
  return (
    <div className="rules">
      <p className="muted">最后留下的那张牌，才是你的真实身份。</p>
      <div className="rule-triptych">
        <div>
          <b>01 · 调和</b>
          <p>背面放置一张牌。结束时点数达到 12 − 人数，调和成功。</p>
        </div>
        <div>
          <b>02 · 质疑</b>
          <p>
            背面放到玩家面前。最高点数者被监禁；并列者均监禁，全员相同则无人监禁。
          </p>
        </div>
        <div>
          <b>03 · 能力</b>
          <p>正面打出一张牌，依提示完成能力。无法执行的能力自动略过。</p>
        </div>
      </div>
      <p>
        所有人只剩一张牌后结算。按顺位从小到大判定，首个满足条件的顺位获胜，同顺位可以共同获胜。被监禁的玩家仍参加胜负判定。
      </p>
      <details open>
        <summary>基础与进阶</summary>
        <p>
          基础：不能质疑自己，质疑总分最低为
          0，自己回合结束只剩一张牌后锁定，不再参加移动手牌的能力，但仍可被调查或质疑。
        </p>
        <p>
          进阶（草稿变体）：允许质疑自己与负质疑分；最后一张牌可被能力移动，但仍跳过正常回合；保健委员需额外弃一张手牌。犯人不能主动使用，但可被交换或传递。
        </p>
      </details>
      <div className="role-list">
        {roles.map((role) => (
          <div key={role}>
            <span className="role-symbol">{cards[role].symbol}</span>
            <div>
              <b>
                {cards[role].name} <small>{cards[role].point} MP</small>
              </b>
              <p>{cards[role].ability}</p>
            </div>
            <span className="role-win">
              {cards[role].win}
              <small>顺位 {cards[role].priority}</small>
            </span>
          </div>
        ))}
      </div>
      <p className="muted">
        原作：ゆお／こっち屋 · 原作美术：うすくち。本项目为非官方本地实现。
        <a
          href="https://www.gamemarket.jp/game/177382"
          target="_blank"
          rel="noreferrer"
        >
          原作介绍 ↗
        </a>
      </p>
    </div>
  );
}

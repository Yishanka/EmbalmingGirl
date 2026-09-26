import { useState, type FormEvent } from "react";
import type { Mode } from "../../../packages/core/src/index";
import type { Send } from "./connection";
export default function Landing({
  send,
  disabled,
  openRules,
}: {
  send: Send;
  disabled: boolean;
  openRules: () => void;
}) {
  const initialCode = new URLSearchParams(location.search).get("room") ?? "";
  const [tab, setTab] = useState(initialCode ? "join" : "create"),
    [name, setName] = useState(localStorage.getItem("eg-name") ?? ""),
    [code, setCode] = useState(initialCode),
    [capacity, setCapacity] = useState(4),
    [mode, setMode] = useState<Mode>("basic");
  function submit(e: FormEvent) {
    e.preventDefault();
    localStorage.setItem("eg-name", name.trim());
    send(tab === "create" ? "create" : "join", {
      name: name.trim(),
      capacity,
      mode,
      code,
    });
  }
  return (
    <>
      <main className="landing">
        <div className="hero-scene" />
        <section className="hero-copy">
          <div className="eyebrow">
            <span className="little-line" /> ST. LILY ACADEMY · 旧校舍
          </div>
          <h1>
            冰冷的她
            <br />
            <span>醒来之前</span>
            <em>。</em>
          </h1>
          <div className="english-title">BEFORE SHE AWAKENS</div>
          <p className="story">
            窗外没有回应，教室里少了一次呼吸。
            <br />
            在天亮之前，替她守住最后的秘密。
            <br />
            <span>又或者，守住你自己的。</span>
          </p>
          <button className="story-link" onClick={openRules}>
            翻开游戏手册 <span>⟶</span>
          </button>
          <div className="hero-facts">
            <div>
              <strong>03—06</strong>
              <span>同行者</span>
            </div>
            <div>
              <strong>10—20</strong>
              <span>分钟 / 一局</span>
            </div>
            <div>
              <strong>13</strong>
              <span>未明身份</span>
            </div>
          </div>
        </section>
        <section className="entry-panel">
          <div className="panel-number">01 / 入 夜</div>
          <h2>
            还有一个座位，
            <br />
            留给你。
          </h2>
          <p className="muted">留下称呼，和熟悉的人一起等待天亮。</p>
          <div className="tabs">
            <button
              className={tab === "create" ? "active" : ""}
              onClick={() => setTab("create")}
            >
              创建房间
            </button>
            <button
              className={tab === "join" ? "active" : ""}
              onClick={() => setTab("join")}
            >
              凭房间号加入
            </button>
          </div>
          <form onSubmit={submit}>
            <label>
              你的称呼
              <input
                autoComplete="nickname"
                required
                maxLength={16}
                placeholder="今晚，怎么称呼你？"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {tab === "create" ? (
              <>
                <fieldset>
                  <legend>同行人数</legend>
                  <div className="segmented">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        type="button"
                        key={n}
                        aria-pressed={capacity === n}
                        className={capacity === n ? "chosen" : ""}
                        onClick={() => setCapacity(n)}
                      >
                        {n}
                        <small>人</small>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>游戏规则</legend>
                  <div className="mode-options">
                    <button
                      type="button"
                      className={mode === "basic" ? "chosen" : ""}
                      aria-pressed={mode === "basic"}
                      onClick={() => setMode("basic")}
                    >
                      <b>基础</b>
                      <small>最后的身份受到保护</small>
                    </button>
                    <button
                      type="button"
                      className={mode === "advanced" ? "chosen" : ""}
                      aria-pressed={mode === "advanced"}
                      onClick={() => setMode("advanced")}
                    >
                      <b>进阶</b>
                      <small>直到最后仍可能改变</small>
                    </button>
                  </div>
                </fieldset>
              </>
            ) : (
              <label>
                六位房间号
                <input
                  className="code-input"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            )}
            <button
              className="primary enter"
              disabled={disabled || !name.trim()}
            >
              {tab === "create" ? "推开教室的门" : "走进这间教室"}
              <span>⟶</span>
            </button>
          </form>
          <div className="entry-foot">
            <span>◌</span> 无需账号 · 凭房间号与好友相聚
          </div>
        </section>
      </main>
      <footer className="footer">
        <span>一场关于信任、隐瞒与告别的游戏</span>
        <span>
          愿长夜终有尽头 <i>✧</i>
        </span>
      </footer>
    </>
  );
}

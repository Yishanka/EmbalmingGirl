import { useEffect, useState } from "react";
import { useConnection } from "./connection";
import { Modal, Rules } from "./components";
import Landing from "./Landing";
import Waiting from "./Waiting";
import Board from "./Board";
export default function App() {
  const net = useConnection();
  const [modal, setModal] = useState<null | "rules" | "settings" | "leave">(
      null,
    ),
    [art, setArt] = useState(localStorage.getItem("eg-art") === "yes");
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const connected = net.status === "connected";
  async function copy() {
    if (!net.room) return;
    const url = new URL(location.href);
    url.searchParams.set("room", net.room.code);
    try {
      await navigator.clipboard.writeText(url.toString());
      setToast("邀请链接已复制");
    } catch {
      setToast(`房间号：${net.room.code}`);
    }
  }
  return (
    <div className={`app ${net.room?.game ? "in-game" : ""}`}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (net.room) setModal("leave");
          }}
        >
          <span className="brand-mark">✧</span>
          <span>
            冰冷的她醒来之前<small>EMBALMING GIRL</small>
          </span>
        </a>
        <nav>
          <span className={`connection ${connected ? "online" : ""}`}>
            <i />
            {connected
              ? "已连接"
              : net.status === "connecting"
                ? "连接中…"
                : net.status === "replaced"
                  ? "席位已转移"
                  : "重连中…"}
          </span>
          <button className="text-button" onClick={() => setModal("rules")}>
            游戏手册 <span>↗</span>
          </button>
          <button
            className="icon-button"
            aria-label="偏好设置"
            onClick={() => setModal("settings")}
          >
            ⚙
          </button>
        </nav>
      </header>
      {!connected && (
        <div className="connection-banner" role="status">
          {net.status === "replaced"
            ? "当前席位正在另一窗口使用。"
            : "与教室的连接暂时中断，正在恢复原席位。"}
          <button onClick={net.reconnect}>
            {net.status === "replaced" ? "以新访客连接" : "立即重连"}
          </button>
        </div>
      )}
      {net.error && (
        <div className="error-toast" role="alert">
          <span>{net.error}</span>
          <button aria-label="关闭提示" onClick={net.clearError}>
            ×
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {!net.room ? (
        <Landing
          send={net.send}
          disabled={!connected || net.pending}
          openRules={() => setModal("rules")}
        />
      ) : net.room.game ? (
        <Board
          room={net.room}
          pid={net.pid}
          send={net.send}
          disabled={!connected || net.pending}
          art={art}
          copy={copy}
          leave={() => setModal("leave")}
        />
      ) : (
        <Waiting
          room={net.room}
          pid={net.pid}
          send={net.send}
          disabled={!connected || net.pending}
          copy={copy}
          leave={() => setModal("leave")}
        />
      )}
      {modal === "rules" && (
        <Modal title="在她醒来之前，记住这些。" close={() => setModal(null)}>
          <Rules />
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="偏好设置" close={() => setModal(null)}>
          <label className="switch-row">
            <span>
              使用本地原图<small>未提供的卡图自动显示默认牌面。</small>
            </span>
            <input
              type="checkbox"
              checked={art}
              onChange={(e) => {
                setArt(e.target.checked);
                localStorage.setItem("eg-art", e.target.checked ? "yes" : "no");
              }}
            />
          </label>
          <p className="muted">
            卡图仅从本地 cards
            目录读取。刷新与重连保留当前席位；新标签页可作为另一名访客入座。
          </p>
        </Modal>
      )}
      {modal === "leave" && (
        <Modal title="离开这间教室？" close={() => setModal(null)}>
          <p>
            {net.room?.game && !net.room.game.result
              ? "离开会中止当前对局，让其余玩家返回准备室。若只是稍作休息，请使用“暂离”。"
              : "离开后将释放你的席位；房主身份会自动移交。"}
          </p>
          <div className="button-row">
            <button onClick={() => setModal(null)}>留在这里</button>
            <button
              className="danger"
              disabled={net.pending}
              onClick={() => {
                net.send("leave");
                setModal(null);
                history.replaceState(null, "", location.pathname);
              }}
            >
              确认离开
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

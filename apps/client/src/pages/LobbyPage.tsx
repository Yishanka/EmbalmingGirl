import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LobbyClient } from 'boardgame.io/client';
import '../css/LobbyPage.css';

const lobbyClient = new LobbyClient({ server: 'http://localhost:8000' });
const GAME_NAME = 'embalming-girl';

// 唯一 id, 用于标识设备
function getOrCreateClientUID() {
  let uid = localStorage.getItem('clientUID');
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem('clientUID', uid);
  }
  return uid;
}

const clientUID = getOrCreateClientUID();

function savePlayerInfo(
  matchID: string,
  playerID: string,
  credentials: string,
  playerName: string
) {
  localStorage.setItem(
    'playerInfo',
    JSON.stringify({
      matchID,
      playerID,
      credentials,
      playerName,
      clientUID,
    })
  );
}

function getPlayerInfo() {
  const data = localStorage.getItem('playerInfo');
  return data ? JSON.parse(data) : null;
}

function clearPlayerInfo() {
  localStorage.removeItem('playerInfo');
}

export default function LobbyPage() {
  const navigate = useNavigate();

  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [matches, setMatches] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [searchMatchID, setSearchMatchID] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);

  const savedInfo = getPlayerInfo();
  const isLocked = !!savedInfo?.matchID;
  const currentMatchID = savedInfo?.matchID;
  const displayName = savedInfo?.playerName || playerName;
  const [ifHelpRemember, setIfHelpRemember] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    const { matches } = await lobbyClient.listMatches(GAME_NAME);
    setMatches(matches);
  }

  async function fetchMatchByID() {
    if (!searchMatchID.trim()) {
      setSearchResult(null);
      return;
    }

    try {
      const match = await lobbyClient.getMatch(GAME_NAME, searchMatchID.trim());
      setSearchResult(match);
    } catch (e) {
      console.error(e);
      setSearchResult(null);
      alert('未找到该房间ID！');
    }
  }

  async function createMatch() {
    if (isLocked) {
      alert('请先退出当前房间，再创建新房间。');
      return;
    }
    const { matchID } = await lobbyClient.createMatch(GAME_NAME, {
      numPlayers,
      setupData: { ifHelpRemember }
    });

    const { playerCredentials, playerID } = await lobbyClient.joinMatch(
      GAME_NAME,
      matchID,
      { playerName: displayName }
    );

    savePlayerInfo(matchID, playerID, playerCredentials, displayName);

    navigate(`/match/${matchID}`, {
      state: { playerID, credentials: playerCredentials, ifHelpRemember },
    });
  }

  async function joinMatch(matchID: string) {
    if (isLocked && currentMatchID !== matchID) {
      alert('您已在其他房间中，请先退出。');
      return;
    }

    const match = await lobbyClient.getMatch(GAME_NAME, matchID);

    const existing = match.players.find(
      (p: any) => p.name === displayName
    );

    // 如果房间内已有同名玩家 → 尝试重连
    if (existing) {
      const saved = getPlayerInfo();
      if (
        saved &&
        saved.playerID === String(existing.id) &&
        saved.credentials
      ) {
        navigate(`/match/${matchID}`, {
          state: {
            playerID: saved.playerID,
            credentials: saved.credentials,
          },
        });
        return;
      } else {
        alert('此昵称已被使用，请先退出原房间或更换昵称。');
        return;
      }
    }

    const { playerCredentials, playerID } = await lobbyClient.joinMatch(
      GAME_NAME,
      matchID,
      { playerName: displayName }
    );

    savePlayerInfo(matchID, playerID, playerCredentials, displayName);

    navigate(`/match/${matchID}`, {
      state: { playerID, credentials: playerCredentials },
    });
  }

  async function leaveMatch(matchID: string) {
    const saved = getPlayerInfo();
    if (!saved) {
      alert('未找到身份信息，无法退出。');
      return;
    }

    await lobbyClient.leaveMatch(GAME_NAME, matchID, {
      playerID: saved.playerID,
      credentials: saved.credentials,
    });

    clearPlayerInfo();
    fetchMatches();
  }

  async function leaveLobby() {
    const saved = getPlayerInfo();
    if (saved) {
      clearPlayerInfo();
    }

    navigate('/')
  }

  function getMatchStatus(match: any) {
    const joinedPlayers = match.players.filter((p: any) => !!p.name).length;
    const capacity = match.players.length;

    if (joinedPlayers < capacity) {
      return '等待';
    }

    const allReady = match.players.every((p: any) => p.name);
    return allReady ? '已开始' : '已满';
  }

  return (
    <div className="lobby-container">
      <h1>大厅</h1>

      <div className="input-group">
        <input
          placeholder="输入玩家昵称"
          value={displayName}
          disabled={isLocked}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          max={6}
          value={numPlayers}
          disabled={isLocked}
          onChange={(e) => setNumPlayers(Number(e.target.value))}
        />
        <label> 是否开启辅助记牌功能 </label>
        <input
          type="checkbox"
          checked={ifHelpRemember}
          disabled={isLocked}
          onChange={(e) => setIfHelpRemember(e.target.checked)}
        />
        <button onClick={createMatch} disabled={!displayName}>
          创建房间
        </button>
      </div>

      <h2>已有房间：</h2>
      {matches.length === 0 && <div>暂无房间</div>}
      {matches.map((m) => {
        const joinedPlayers = m.players.filter((p: any) => !!p.name).length;
        const capacity = m.players.length;
        const status = getMatchStatus(m);

        return (
          <div className="match-card" key={m.matchID}>
            <div>房间ID: {m.matchID}</div>
            <div>玩家: {m.players.map((p: any) => p.name || '---').join(', ')}</div>
            <div>状态: {status}</div>
            <button
              onClick={() => joinMatch(m.matchID)}
              disabled={
                !displayName ||
                joinedPlayers >= capacity ||
                (isLocked && currentMatchID !== m.matchID)
              }
            >
              加入房间
            </button>

            {m.matchID === currentMatchID && (
              <button
                className="leave-button"
                onClick={() => leaveMatch(m.matchID)}
              >
                退出房间
              </button>
            )}
          </div>
        );
      })}

      <h2>根据房间 ID 搜索：</h2>
      <div className="input-group">
        <input
          placeholder="房间 ID"
          value={searchMatchID}
          onChange={(e) => setSearchMatchID(e.target.value)}
        />
        <button onClick={fetchMatchByID}>搜索</button>
      </div>

      {searchResult && (
        <div className="match-card">
          <div>房间ID: {searchResult.matchID}</div>
          <div>
            玩家:{' '}
            {searchResult.players.map((p: any) => p.name || '---').join(', ')}
          </div>
          <div>状态: {getMatchStatus(searchResult)}</div>
          <button
            onClick={() => joinMatch(searchResult.matchID)}
            disabled={
              !displayName ||
              searchResult.players.filter((p: any) => !!p.name).length >=
                searchResult.players.length
            }
          >
            加入该房间
          </button>
          {searchResult.matchID === currentMatchID && (
            <button
              className="leave-button"
              onClick={() => leaveMatch(searchResult.matchID)}
            >
              退出房间
            </button>
          )}
        </div>
      )}

      <hr />
      <button className="exit-button" onClick={() => leaveLobby()}>
        退出 Lobby
      </button>
    </div>
  );
}

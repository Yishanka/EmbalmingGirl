import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { EmbalmingGirlGame, EmbalmingGirlState } from 'shared';
import { EmbalmingGirlBoard } from '../board/EmbalmingGirlBoard';

export default function MatchPage() {
  const { matchID } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { playerID, credentials, ifHelpRemember } = location.state || {};

  if (!matchID || !playerID || !credentials) {
    return (
      <div>
        无效的房间链接或参数丢失。
        <button onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  const GameClient = Client({
    game: EmbalmingGirlGame,
    board: EmbalmingGirlBoard,
    multiplayer: SocketIO({ server: 'http://localhost:8000' }),
    debug: true
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>对局中：{matchID}</h1>
      <GameClient
        matchID={matchID}
        playerID={playerID}
        credentials={credentials}
      />
      <button style={{ marginTop: 20 }} onClick={() => navigate('/lobby')}>
        暂离对局
      </button>
    </div>
  );
}
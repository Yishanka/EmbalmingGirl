import React, { useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { EmbalmingGirlState, Card } from 'shared';
import '../css/EmbalmingGirlBoard.css';

export const EmbalmingGirlBoard: React.FC<BoardProps<EmbalmingGirlState>> = ({
  G,
  ctx,
  moves,
  playerID,
}) => {
  const me = G.players.find(p => p.id === playerID);
  const isMyTurn = ctx.currentPlayer === playerID;
  const everyoneReady = G.players.every(p => p.isReady);
  const isHost = playerID === '0';

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;
    setSelectedCardIndex(index === selectedCardIndex ? null : index);
  };

  const currentStage = ctx.activePlayers?.[playerID ?? ''];

  return (
    <div className="game-container">
      {/* 顶部公开信息区 */}
      <div className="top-status-bar">
        {G.players.map((p) => (
          <div
            key={p.id}
            className={`status-pill ${p.isReady ? 'ready' : 'not-ready'}`}
          >
            玩家 {p.id}
          </div>
        ))}
      </div>





      {/* 调试显示当前阶段 */}
      <div style={{ padding: '8px', backgroundColor: '#fffae6', border: '1px solid #ffcc00', marginBottom: '8px', fontWeight: 'bold' }}>
        当前阶段 currentStage: {currentStage ?? '无'}
      </div>





      {/* 中部牌桌区 */}
      <div className="table-area">
        <div className="played-cards">
          <h3>打出区</h3>
          {G.playedCards.cards.map((c: Card, i: number) => (
            <img
              key={i}
              src={`../../public/card_image/${c.cardInfo.id}.png`}
              alt={c.cardInfo.name}
              className={`card-on-table ${currentStage === 'TakeCardFromPlayed' ? 'clickable' : ''}`}
              onClick={() => {
                if (currentStage === 'TakeCardFromPlayed') { // 拿牌
                  moves.takeCardFromPlayed?.(i);
                }
              }}
            />
          ))}
        </div>

        <div className="harmony-cards">
          <h3>调和区</h3>
          {G.harmonyCards.cards.map((_, i: number) => (
            <img
              key={i}
              src="../../public/card_image/card-back.png"
              alt=""
              className="card-on-table"
            />
          ))}
        </div>
      </div>

      {/* 底部手牌 + 控制按钮区 */}
      <div className="bottom-hand-area">
        <div className="hand-cards">
          {me?.handCards.cards.map((card: Card, index: number) => {
            const isSelected = selectedCardIndex === index;
            return (
              <button
                key={index}
                className={`hand-card ${isSelected ? 'selected' : ''}`}
                disabled={!isMyTurn}
                onClick={() => handleCardClick(index)}
              >
                <img
                  src={card.condition === 'down'
                    ? '../../public/card_image/card-back.png'
                    : `../../public/card_image/${card.cardInfo.id}.png`}
                  alt={card.condition === 'down'
                    ? ''
                    : `${card.cardInfo.name}`}
                  className="card-image"
                />
              </button>
            );
          })}
        </div>


        <div className="viewed-harmony-cards">
          <h4>你查看过的调和牌：</h4>
          <div className="viewed-cards-list">
            {me?.viewedHarmonyCards.cards.map((card, idx) => (
              <img
                key={idx}
                src={card.condition === 'down'
                    ? '../../public/card_image/card-back.png'
                    : `../../public/card_image/${card.cardInfo.id}.png`}
                alt={card.condition === 'down'
                  ? ''
                  : `${card.cardInfo.name}`}
                className="card-image small"
              />
            ))}
          </div>
        </div>

        {/* 控制按钮：只有选中卡牌时才显示 */}
        {selectedCardIndex !== null && isMyTurn && (
          <div className="control-buttons">
            <button onClick={() => {
              moves.playCard?.(selectedCardIndex);
              setSelectedCardIndex(null);
            }}>
              打出
            </button>
            <button onClick={() => {
              moves.harmonyCard?.(selectedCardIndex);
              setSelectedCardIndex(null);
            }}>
              调和
            </button>
            <button disabled>监禁（未实现）</button>
          </div>
        )}

        {/* 准备/开始按钮 */}
        {!G.gameStarted && (
          <div className="control-buttons">
            <button className="control-button" onClick={() => moves.toggleReady()}>
              {me?.isReady ? '取消准备' : '点击准备'}
            </button>
            {isHost && everyoneReady && (
              <button className="control-button start" onClick={() => moves.startGame()}>
                开始游戏
              </button>
            )}
          </div>
        )}

        {/* 使用图书委员，查看调和卡牌 */}
        {currentStage === 'CheckHarmonyCards' && (
          <div className="control-buttons">
            <button 
              className="control-button" 
              onClick={() => {
                moves.checkHarmonyCards?.()
              }}>
              查看调和牌
            </button>
          </div>
        )} {/* 可以改成打出即查看，之后选择结束 */}
        
      </div>
    </div>
  );
};
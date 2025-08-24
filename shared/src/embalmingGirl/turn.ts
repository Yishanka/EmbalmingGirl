import { TurnConfig } from "boardgame.io";
import { EmbalmingGirlState, Card, CardInfo} from './types';
import { 
    CardInfo_Xueshenghuizhang, // 1 张
    CardInfo_Baojianweiyuan, // 2 张
    CardInfo_Tushuweiyuan, //  5 人时 3 张，其余 2 张
    CardInfo_Fengjiweiyuan, //  3 人时 1 张，其余 2 张
    CardInfo_Daxiaojie, //  3 人时 2 张，其余 3 张
    CardInfo_Banzhang, // 2 张
    CardInfo_Youdengsheng, // 3 人时 1 张，其余 2 张
    CardInfo_Xinwenbu, // 3 人时 2 张，其余 3 张
    CardInfo_Fanren, // 1 张
    CardInfo_Gongfan, // 3 人时 0 张，其余 1 张
    CardInfo_Waixingren, // 1 张
    CardInfo_Ganranzhe, // 1 张
    CardInfo_Guizhaibu, // 3 人时 2 张，其余 3 张
} from './cards';
import { INVALID_MOVE} from 'boardgame.io/core';

export const turn: TurnConfig<EmbalmingGirlState> = {
    order: {
        first: ({ G }) => {
            const index = G.players.findIndex((p: any) => p.id === G.firstPlayer);
            return index >= 0 ? index : 0;
        },
        next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
    stages: {
        TakeCardFromPlayed: {
            moves: {
                takeCardFromPlayed(context, playedCardIndex: number) { // 从打出牌中抽回一张牌
                    // 检查是否存在非保健委员的牌可抽
                    const G = context.G;
                    const ctx = context.ctx;
                    const validCards = G.playedCards.cards.filter(
                        c => c.cardInfo.id !== CardInfo_Baojianweiyuan.id
                    );
                    if (validCards.length === 0) {
                        // 没有可抽的牌，自动结束阶段
                        context.events.endStage();
                        return;
                    }

                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;

                    if (playedCardIndex < 0 || playedCardIndex >= G.playedCards.cards.length) return INVALID_MOVE;

                    const chosenCard = G.playedCards.cards[playedCardIndex];
                    if (chosenCard.cardInfo.id === CardInfo_Baojianweiyuan.id) return INVALID_MOVE // 不能抽保健委员
                    
                    chosenCard.condition = 'hand';
                    G.playedCards.cards.splice(playedCardIndex, 1); 
                    player.handCards.cards.push(chosenCard);
                    
                    context.events.endStage();
                    return;
                },
            },
        },
        CheckHarmonyCards: {
            moves:{
                checkHarmonyCards(context){ // 查看所有调和牌
                    const G = context.G;
                    const ctx = context.ctx;                  
                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;
                    
                    for (const c of player.viewedHarmonyCards.cards) {
                        c.condition = 'hand';
                    }

                    context.events.endStage();
                    return;
                },
            }
        },
        CheckPlayerHandCards: {
            moves:{
                // 查看某玩家的牌
                checkPlayerHandCards(context, targetPlayerId: string){
                    const G = context.G;
                    const ctx = context.ctx;
                    
                    if (targetPlayerId === ctx.currentPlayer) return INVALID_MOVE;
                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;

                    const target = G.players.find(p => p.id === targetPlayerId);
                    if (!target) return INVALID_MOVE;
                    
                    // 更新看牌记录
                    // 深拷贝，保持静态
                    const copy = {
                        cards: target.handCards.cards.map(card => ({
                            cardInfo: { ...card.cardInfo },
                            from: target.id, // 在 current player 这，上一个持有他的人是 target
                            condition: 'hand' as const
                        })),
                        belong: target.handCards.belong // belong 不变
                    };
                    const ifViewed = player.viewedHandCards.find(c => c.belong === targetPlayerId)
                    
                    if (!ifViewed){ // 没有看过，push copy
                        player.viewedHandCards.push(copy);
                    } else { // 看过了，用 copy 替换这里的牌
                        ifViewed.cards = copy.cards;
                    }

                    context.events.endStage();
                    return;
                },
            }
        },
        TakePlayerHandCard: {
            moves: {
                takePlayerHandCard(context, targetPlayerId: string, targetHandCardIndex: number){
                    const G = context.G;
                    const ctx = context.ctx;
                    if (targetPlayerId === ctx.currentPlayer) return INVALID_MOVE;
                    
                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;

                    const target = G.players.find(p => p.id === targetPlayerId);
                    if (!target) return INVALID_MOVE;
                    
                    // 选择要抽取的卡牌
                    if (targetHandCardIndex < 0 || targetHandCardIndex >= target.handCards.cards.length) return INVALID_MOVE;
                    const targetHandCard = target.handCards.cards[targetHandCardIndex];
                    targetHandCard.condition = 'hand';
                    targetHandCard.from = targetPlayerId;

                    // 放到交互区
                    G.interactInfo.push({
                        card: targetHandCard,
                        to: player.id
                    });
                    
                    context.events.setActivePlayers({
                        currentPlayer: 'GiveOutHandCard'
                    });
                    return;
                },
            }
        },
        GiveOutHandCard: {
            moves: {
                giveOutHandCard(context, targetPlayerId: string, crtHandCardIndex: number, ifGiveBack: boolean){
                    const G = context.G;
                    const ctx = context.ctx;
                    if (targetPlayerId === ctx.currentPlayer) return INVALID_MOVE;
                    
                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;
                    
                    const target = G.players.find(p => p.id === targetPlayerId);
                    if (!target) return INVALID_MOVE;
                    
                    // 选择要给出的手牌
                    if (crtHandCardIndex < 0 || crtHandCardIndex >= player.handCards.cards.length) return INVALID_MOVE;
                    const crtHandCard = player.handCards.cards[crtHandCardIndex];
                    crtHandCard.condition = 'down';
                    crtHandCard.from = player.id;
                    
                    G.interactInfo.push({
                        card: crtHandCard,
                        to: target.id
                    });

                    if (ifGiveBack) {
                        context.events.setActivePlayers({
                            value: {
                                targetPlayerId: 'GiveOutHandCard'
                            }
                        });
                    }
                    else {
                        // 把 interactInfo 里的卡按照 to 放到玩家手牌里
                        for (const p of G.players) {
                            const card = G.interactInfo.find(c => c.to === p.id)?.card;
                            if (card) p.handCards.cards.push(card);
                        }
                        context.events.endStage();
                    }

                    return;
                }
            }
        },
        ClaimIfCriminal: {
            moves: {
                claimIfCriminal(context){
                    const G = context.G;
                    const ctx = context.ctx;
                    // todo: 让玩家选择是否表明自己是犯人


                }
            }
        },
        MoveImprisonCard: {
            moves: {
                moveImprisonCard(context, targetPlayerId: string, cardIndex: number, toPlayerId: string){
                    const G = context.G;
                    const ctx = context.ctx;
                    
                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;

                    const targetPlayer = G.players.find(p => p.id === targetPlayerId);
                    if (!targetPlayer) return INVALID_MOVE;

                    if (cardIndex < 0 || cardIndex >= targetPlayer.imprisonedCards.cards.length) return INVALID_MOVE;
                    const card = targetPlayer.imprisonedCards.cards[cardIndex];

                    const toPlayer = G.players.find(p => p.id === toPlayerId);
                    if (!toPlayer) return INVALID_MOVE;
                    
                    toPlayer.imprisonedCards.cards.push(card);

                    return;
                }
            }
        },
        TakeHarmonyCard: {
            moves: {
                takeHarmonyCard(context, cardIndex: number){
                    const G = context.G;
                    const ctx = context.ctx;
                    
                    const player = G.players.find(p => p.id === ctx.currentPlayer);
                    if (!player) return INVALID_MOVE;

                    if (cardIndex < 0 || cardIndex >= G.harmonyCards.cards.length) return INVALID_MOVE;
                    const card = G.harmonyCards.cards[cardIndex];
                    card.condition = 'hand'
                    
                    player.handCards.cards.push(card);

                    return;
                }
            }
        },
    },
};
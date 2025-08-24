import { INVALID_MOVE} from 'boardgame.io/core';
import { Ctx, MoveMap } from 'boardgame.io';

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

export const moves: MoveMap<EmbalmingGirlState>  = {
    // 玩家点击准备
    toggleReady: (context) => {
        const G = context.G;
        const ctx = context.ctx;
        const player = G.players.find(p => p.id === ctx.currentPlayer);
        if (player) {
            player.isReady = !player.isReady;
        }
    },

    // 房主调用，全部准备后开始游戏
    startGame: (context) => {
        // console.log('开始比赛')
        function generateDeck(playerCount: number): Card[] {
            const deck: Card[] = [];
            // 打乱牌堆
            function shuffle<T>(array: T[]): T[] {
            const result = [...array];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
            }
            function pushCard(cardInfo: CardInfo, count: number) {
                for (let i = 0; i < count; i++) {
                    deck.push({
                        cardInfo: cardInfo,
                        from: 'default',
                        condition: 'hand',
                    });
                }
            }
        
            // 基础配置（根据你模板里的注释来决定数量）
            pushCard(CardInfo_Xueshenghuizhang, 1);
            pushCard(CardInfo_Baojianweiyuan, 2);
            pushCard(CardInfo_Tushuweiyuan, playerCount === 5 ? 3 : 2);
            pushCard(CardInfo_Fengjiweiyuan, playerCount === 3 ? 1 : 2);
            pushCard(CardInfo_Daxiaojie, playerCount === 3 ? 2 : 3);
            pushCard(CardInfo_Banzhang, 2);
            pushCard(CardInfo_Youdengsheng, playerCount === 3 ? 1 : 2);
            pushCard(CardInfo_Xinwenbu, playerCount === 3 ? 2 : 3);
            pushCard(CardInfo_Fanren, 1);
            pushCard(CardInfo_Gongfan, playerCount === 3 ? 0 : 1);
            pushCard(CardInfo_Waixingren, 1);
            pushCard(CardInfo_Ganranzhe, 1);
            pushCard(CardInfo_Guizhaibu, playerCount === 3 ? 2 : 3);
            
            return shuffle(deck); // 打乱顺序
        }
        
        const G = context.G;
        if (G.gameStarted) return; // 已经开始了

        // 检查是否所有玩家都准备
        if (!G.players.every(p => p.isReady)) {
            return; // 不满足条件，不能开始
        }

        const playerCount = G.players.length;
        const deck = generateDeck(playerCount);
        
        // 发牌
        for (const player of G.players) {
            const totalCardsPerPlayer = Math.floor(deck.length / playerCount);
            player.handCards.cards = deck.splice(0, totalCardsPerPlayer);
        }

        // 找首位玩家
        let firstPlayer = null;
        for (const player of G.players) {
            if (player.handCards.cards.some(c => c.cardInfo?.id === CardInfo_Xueshenghuizhang.id)) {
                firstPlayer = player.id;
                break;
            }
        }

        G.firstPlayer = firstPlayer;
        G.gameStarted = true;
    },

    // 正面打出牌
    playCard: (context, index: number) => {
        context.events.endStage();

        const G = context.G;
        const ctx = context.ctx;

        // 判断是否有该名玩家
        const player = G.players.find(p => p.id === ctx.currentPlayer);
        if (!player) return INVALID_MOVE;

        // 判断是否有这张牌出
        if (index < 0 || index >= player.handCards.cards.length) return INVALID_MOVE;

        // 出牌，并修改牌的状态
        const card = player.handCards.cards[index];
        if (card.cardInfo.id === CardInfo_Fanren.id) { // 不可以打出犯人
            return INVALID_MOVE
        }
        card.condition = 'up';
        card.from = player.id // 记录由谁打出
        player.handCards.cards.splice(index, 1);
        
        // 添加到 playedCards
        G.playedCards.cards.push(card);
        
        // 使用这张牌的能力
        if (card.cardInfo.id === CardInfo_Xueshenghuizhang.id) { // 学生会长，无能力
            return;
        } else if (card.cardInfo.id === CardInfo_Baojianweiyuan.id) { // 保健委员：从正面打出的牌（除保健委员）中抽走一张到自己的手牌中
            context.events?.setActivePlayers?.({
                currentPlayer: 'TakeCardFromPlayed'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Tushuweiyuan.id) { // 图书委员：查看所有调和位置的牌
            context.events?.setActivePlayers?.({
                currentPlayer: 'CheckHarmonyCards'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Fengjiweiyuan.id) { // 风纪委员：查看任意一名玩家的全部手牌
            context.events?.setActivePlayers?.({
                currentPlayer: 'CheckPlayerHandCards'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Daxiaojie.id) { // 大小姐：抽取任意一名玩家的一张手牌并给ta自己的一张手牌
            context.events?.setActivePlayers?.({
                currentPlayer: 'TakePlayerHandCard'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Banzhang.id) { // 班长：指定任意一名玩家与自己交换一张手牌
            context.events?.setActivePlayers?.({
                currentPlayer: 'GiveOutHandCard'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Youdengsheng.id) { // 优等生：查看犯人卡当前在谁手上
            let fanren
            let waixingren
            for (const p of G.players) {
                const fanrenCard = p.handCards.cards.find(c => c.cardInfo.id == CardInfo_Fanren.id)
                if (fanrenCard) {
                    fanren = p.id
                }
                const waixingrenCard = p.handCards.cards.find(c => c.cardInfo.id == CardInfo_Waixingren.id)
                if (waixingrenCard) {
                    waixingren = p.id
                }
            }
            if (waixingren) {
                context.events?.setActivePlayers?.({
                    value: {
                        waixingren : 'ClaimIfCriminal'
                    }
                });
            }
            // todo: 是否要把分开处理犯人和外星人逻辑，以及前后端交互
            return;
        } else if (card.cardInfo.id === CardInfo_Xinwenbu.id) { // 新闻部：把卡牌移交到下家手上
            context.events?.setActivePlayers?.({
                all: 'GiveOutHandCard'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Gongfan.id) { // 共犯：移动一张监禁卡
            context.events?.setActivePlayers?.({
                currentPlayer: 'MoveImprisonCard'
            });
            return;
        } else if (card.cardInfo.id === CardInfo_Waixingren.id) { // 外星人，没有能力
            return;
        } else if (card.cardInfo.id === CardInfo_Ganranzhe.id) { // 感染者：下一回合可以从调和位置的牌中抽取一张作为手牌
            // todo: 下一个 turn 的时候再让出牌者先拿牌
            return;
        } else if (card.cardInfo.id === CardInfo_Guizhaibu.id) { // 归宅部：从调和牌中抽取一张并与自己的手牌交换
            context.events?.setActivePlayers?.({
                currentPlayer: 'TakeHarmonyCard'
            });
            return;
        } else {
            return INVALID_MOVE
        }
    },

    // 用卡牌调和
    harmonyCard: ({G, ctx}, index: number) => {
        const player = G.players.find(p => p.id === ctx.currentPlayer);
        if (!player) return INVALID_MOVE;

        if (index < 0 || index >= player.handCards.cards.length) return INVALID_MOVE;

        // 出牌
        const card = player.handCards.cards[index];
        if (card.cardInfo.id === CardInfo_Fanren.id) { // 不可以打出犯人
            return INVALID_MOVE
        }
        card.from = player.id // 记录由谁打出
        card.condition = 'down';
        player.handCards.cards.splice(index, 1);

        // 放入调和牌堆
        G.harmonyCards.cards.push(card);

        // 更新所玩家的 viewedHarmonyCards
        for (const p of G.players) {
            p.viewedHarmonyCards.cards.push(card);
        }

        return;
    }, 

    // 用卡牌监禁玩家
    imprisonCard({G, ctx}, index: number, targetPlayerId: string) {
        const player = G.players.find(p => p.id === ctx.currentPlayer);
        if (!player) return INVALID_MOVE;

        // 判断是否有目标玩家
        const targetPlayer = G.players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return INVALID_MOVE;

        if (index < 0 || index >= player.handCards.cards.length) return INVALID_MOVE;

        const card = player.handCards.cards[index];
        if (card.cardInfo.id === CardInfo_Fanren.id || card.cardInfo.id ) { // 不可以打出犯人
            return INVALID_MOVE
        }
        card.condition = 'down';
        card.from = player.id // 记录由谁打出
        player.handCards.cards.splice(index, 1);

        // 放入目标玩家的监禁牌堆
        targetPlayer.imprisonedCards.cards.push(card);

        return;
    },




};
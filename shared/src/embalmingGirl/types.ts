// 卡牌类型，决定胜利条件
export type CardType =| '好人' | '犯人' | '共犯' | '外星人' | '感染者' | '归宅部';

// 单张卡牌的定义
export interface CardInfo {
  // 卡牌核心逻辑，必须
  id: string;               // 卡牌唯一 id
  point: number;            // 点数
  type: CardType;           // 类型
  
  // 卡牌描述，不一定需要 
  name: string;             // 卡牌名称
  ability?: string | null;  // 卡牌正面打出能力描述
  special?: string | null;  // 卡牌特殊能力描述
  win?: string;              // 卡牌胜利条件描述
}

// 单张牌
export interface Card {
  cardInfo: CardInfo;               // 牌的类型
  from: string;                     // 上一个持有它的人
  condition: 'hand' | 'up' | 'down';     // 牌的三种状态：手牌（自己看得到别人看不到），正面（所有人都看得到），背面（所有人都看不到）
}

// 一组牌，
export interface Cards {
  cards: Card[];
  belong?: string; // 如果是手牌，标志这组牌是属于谁的
}

// 单个玩家的状态
export interface PlayerState {
  id: string;
  isReady: boolean;
  handCards: Cards;              // 手牌,，condition 初始化为 hand
  imprisonedCards: Cards;       // 自己被监禁的牌，condition 初始化为 down
  viewedHarmonyCards: Cards;    // 查看的调和区的牌，辅助记牌会实时更新，condition 初始化为 down
  viewedHandCards: Cards[];      // 查看的手牌，辅助记牌不会实时更新，condition 初始化为 hand
}

export interface InteractInfo {
    card: Card;
    to: string;
}

// 整个游戏状态
export interface EmbalmingGirlState {
  // ifLevelup: boolean         // 是否开启进阶模式
  ifHelpRemember: boolean;      // 是否开启记牌辅助
  players: PlayerState[];
  playedCards: Cards;          // 历史打出牌记录，condition 初始化为 up
  harmonyCards: Cards;         // 调和区的牌，condition 初始化为 down
  firstPlayer: string | null;   // 班长先手
  gameStarted: boolean;
  interactInfo: InteractInfo[];   // 交互信息
}

//todo: 多级记牌辅助：1. 记录单次看牌的牌；2. 记录看牌后调和牌的变动；
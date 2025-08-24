import { CardInfo } from './types';

export const CardInfo_Xueshenghuizhang: CardInfo = {
  id: 'card-xueshenghuizhang',
  type: '好人',
  point: 3,

  name: '学生会长',
  win: '调和点数满即胜利',
  ability: null,
  special: '发完牌后，拥有这张牌的人先出牌',
};
export const CardInfo_Baojianweiyuan: CardInfo = {
  id: 'card-baojianweiyuan',
  type: '好人',
  point: 1,

  name: '保健委员',
  win: '调和点数满即胜利',
  ability: '从正面打出的牌（除保健委员）中抽走一张到自己的手牌中',
  special: null,
};
export const CardInfo_Tushuweiyuan: CardInfo = {
  id: 'card-tushuweiyuan',
  type: '好人',
  point: 1,

  name: '图书委员',
  win: '调和点数满即胜利',
  ability: '查看所有调和位置的牌',
  special: null,
};
export const CardInfo_Fengjiweiyuan: CardInfo = {
  id: 'card-fengjiweiyuan',
  type: '好人',
  point: 1,

  name: '风纪委员',
  win: '调和点数满即胜利',
  ability: '查看任意一名玩家的全部手牌',
  special: null,
};
export const CardInfo_Daxiaojie: CardInfo = {
  id: 'card-daxiaojie',
  type: '好人',
  point: 1,

  name: '大小姐',
  win: '调和点数满即胜利',
  ability: '抽取任意一名玩家的任意一张手牌并给这名玩家一张自己的手牌交换',
  special: null,
};
export const CardInfo_Banzhang: CardInfo = {
  id: 'card-banzhang',
  type: '好人',
  point: 2,

  name: '班长',
  win: '调和点数满即胜利',
  ability: '指定任意一名玩家与自己交换一张手牌',
  special: null,
};
export const CardInfo_Youdengsheng: CardInfo = {
  id: 'card-youdengsheng',
  type: '好人',
  point: 2,

  name: '优等生',
  win: '调和点数满即胜利',
  ability: '查看犯人卡当前在谁手上',
  special: null,
};
export const CardInfo_Xinwenbu: CardInfo = {
  id: 'card-xinwenbu',
  type: '好人',
  point: 1,

  name: '新闻部',
  win: '调和点数满即胜利',
  ability: '让所有人将一张手牌传给左边玩家',
  special: null,
};
export const CardInfo_Fanren: CardInfo = {
  id: 'card-fanren',
  type: '犯人',
  point: 0,

  name: '犯人',
  win: '没有被监禁即胜利',
  ability: null,
  special: '这张牌不能被主动打出（正面打出、监禁或调和），只能通过其他牌的 ability 移动',
};
export const CardInfo_Gongfan: CardInfo = {
  id: 'card-gongfan',
  type: '共犯',
  point: 0,

  name: '共犯',
  win: '犯人胜利即胜利',
  ability: '背面朝上，用场上任意一张监禁牌监禁另一名玩家',
  special: null,
};
export const CardInfo_Waixingren: CardInfo = {
  id: 'card-waixingren',
  type: '外星人',
  point: -1,

  name: '外星人',
  win: '被监禁即胜利',
  ability: null,
  special: '不能用于监禁玩家; 持有这张牌时可以装作犯人',
};
export const CardInfo_Ganranzhe: CardInfo = {
  id: 'card-ganranzhe',
  type: '感染者',
  point: 0,

  name: '感染者',
  win: '调和点数不满即胜利',
  ability: '下一轮先从调和位置的牌中抽取一张作为手牌再进行其他操作',
  special: null,
};
export const CardInfo_Guizhaibu: CardInfo = {
  id: 'card-guizhaibu',
  type: '归宅部',
  point: 0,
  
  name: '归宅部',
  win: '没有人胜利即胜利',
  ability: '从调和牌堆选一张牌与自己手中的一张牌交换',
  special: null,
};

// 卡牌模板池，定义卡牌模板
export const AllCardInfos: Record<string, CardInfo> = {
  [CardInfo_Xueshenghuizhang.id]: CardInfo_Xueshenghuizhang, // 1 张
  [CardInfo_Baojianweiyuan.id]: CardInfo_Baojianweiyuan, // 2 张
  [CardInfo_Tushuweiyuan.id]: CardInfo_Tushuweiyuan, //  5 人时 3 张，其余 2 张
  [CardInfo_Fengjiweiyuan.id]: CardInfo_Fengjiweiyuan, //  3 人时 1 张，其余 2 张
  [CardInfo_Daxiaojie.id]: CardInfo_Daxiaojie, //  3 人时 2 张，其余 3 张
  [CardInfo_Banzhang.id]: CardInfo_Banzhang, // 2 张
  [CardInfo_Youdengsheng.id]: CardInfo_Youdengsheng, // 3 人时 1 张，其余 2 张
  [CardInfo_Xinwenbu.id]: CardInfo_Xinwenbu, // 3 人时 2 张，其余 3 张
  [CardInfo_Fanren.id]: CardInfo_Fanren, // 1 张
  [CardInfo_Gongfan.id]: CardInfo_Gongfan, // 3 人时 0 张，其余 1 张
  [CardInfo_Waixingren.id]: CardInfo_Waixingren, // 1 张
  [CardInfo_Ganranzhe.id]: CardInfo_Ganranzhe, // 1 张
  [CardInfo_Guizhaibu.id]: CardInfo_Guizhaibu, // 3 人时 2 张，其余 3 张
};
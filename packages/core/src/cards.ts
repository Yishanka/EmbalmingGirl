export const cards = {
  president: {
    name: "学生会长",
    point: 3,
    symbol: "♜",
    ability: "无主动能力。持有此牌的玩家先行动。",
    win: "调和成功",
    priority: 4,
    count: 1,
  },
  nurse: {
    name: "保健委员",
    point: 1,
    symbol: "✚",
    ability: "回收一张已打出的非保健委员牌。进阶模式需额外弃一张手牌。",
    win: "调和成功",
    priority: 4,
    count: 2,
  },
  librarian: {
    name: "图书委员",
    point: 1,
    symbol: "▤",
    ability: "秘密查看当前全部调和牌。",
    win: "调和成功",
    priority: 4,
    count: 3,
  },
  prefect: {
    name: "风纪委员",
    point: 1,
    symbol: "◇",
    ability: "秘密查看一名其他玩家的全部手牌。",
    win: "调和成功",
    priority: 4,
    count: 2,
  },
  lady: {
    name: "大小姐",
    point: 1,
    symbol: "♛",
    ability: "抽取一名其他玩家的一张手牌，再交还一张手牌。",
    win: "调和成功",
    priority: 4,
    count: 3,
  },
  press: {
    name: "新闻部",
    point: 1,
    symbol: "◈",
    ability: "所有可参与的玩家同时选一张手牌，传给下一位参与者。",
    win: "调和成功",
    priority: 4,
    count: 3,
  },
  leader: {
    name: "班长",
    point: 2,
    symbol: "⚑",
    ability: "指定一名其他玩家，双方各自选一张手牌同时交换。",
    win: "调和成功",
    priority: 4,
    count: 2,
  },
  honor: {
    name: "优等生",
    point: 2,
    symbol: "✧",
    ability: "秘密获知犯人声明。犯人必须声明，外星人可选择冒充。",
    win: "调和成功",
    priority: 4,
    count: 2,
  },
  criminal: {
    name: "犯人",
    point: 0,
    symbol: "†",
    ability: "不能主动打出、调和或质疑；可被能力移动。",
    win: "未被监禁",
    priority: 3,
    count: 1,
  },
  accomplice: {
    name: "共犯",
    point: 0,
    symbol: "⌁",
    ability: "把一张质疑牌移到另一名玩家面前。",
    win: "犯人获胜",
    priority: 3,
    count: 1,
  },
  alien: {
    name: "外星人",
    point: -1,
    symbol: "◎",
    ability: "无主动能力。可以在优等生调查时冒充犯人。",
    win: "被监禁",
    priority: 1,
    count: 1,
  },
  infected: {
    name: "感染者",
    point: 0,
    symbol: "☿",
    ability: "若仍有下一回合，先抽取一张调和牌，再正常行动。",
    win: "调和失败",
    priority: 2,
    count: 1,
  },
  home: {
    name: "归宅部",
    point: 0,
    symbol: "⌂",
    ability: "用一张手牌与一张背面朝上的调和牌交换。",
    win: "没有其他身份获胜",
    priority: 5,
    count: 3,
  },
} as const;
export type Role = keyof typeof cards;
export type Card = { id: string; role: Role };
export type Mode = "basic" | "advanced";
export function deckFor(count: number): Card[] {
  if (![3, 4, 5, 6].includes(count)) throw new Error("需要 3–6 名玩家");
  return (Object.keys(cards) as Role[]).flatMap((role) => {
    let n: number = cards[role].count;
    if (count !== 5 && role === "librarian") n--;
    if (
      count === 3 &&
      (
        ["accomplice", "honor", "prefect", "lady", "press", "home"] as Role[]
      ).includes(role)
    )
      n--;
    return Array.from({ length: n }, (_, i) => ({ id: `${role}-${i}`, role }));
  });
}

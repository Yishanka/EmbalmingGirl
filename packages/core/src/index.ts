import { cards, deckFor, type Card, type Mode, type Role } from "./cards";
export * from "./cards";
export type Action = {
  type: string;
  card?: string;
  target?: string;
  other?: string;
  index?: number;
  declare?: boolean;
};
export type Choice = { action: Action; label: string };
export type Player = {
  id: string;
  name: string;
  hand: Card[];
  suspicion: Card[];
  locked: boolean;
  drawLater: boolean;
  notes: string[];
};
type Phase = {
  kind: string;
  actor: string;
  target?: string;
  participants?: string[];
  choices?: Record<string, Action>;
};
export type Result = {
  winners: string[];
  reason: string;
  points: number;
  threshold: number;
  suspicion: Record<string, number>;
  jailed: string[];
};
export type Game = {
  players: Player[];
  mode: Mode;
  turn: number;
  round: number;
  phase: Phase | null;
  embalming: Card[];
  discarded: Card[];
  log: string[];
  result: Result | null;
};
const fail = (text: string): never => {
  throw new Error(text);
};
const get = (g: Game, id: string) =>
  g.players.find((p) => p.id === id) ?? fail("玩家不存在");
const movable = (g: Game, p: Player) => g.mode === "advanced" || !p.locked;
const take = (pile: Card[], id: string | undefined) => {
  const i = pile.findIndex((c) => c.id === id);
  if (i < 0) fail("卡牌不存在");
  return pile.splice(i, 1)[0];
};
const name = (c: Card) => cards[c.role].name;
function note(p: Player, text: string) {
  p.notes.unshift(text);
  p.notes = p.notes.slice(0, 20);
}
export function createGame(
  seats: { id: string; name: string }[],
  mode: Mode,
  random = Math.random,
): Game {
  const deck = deckFor(seats.length);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const handSize = deck.length / seats.length;
  const players = seats.map((s) => ({
    ...s,
    hand: deck.splice(0, handSize),
    suspicion: [],
    locked: false,
    drawLater: false,
    notes: [],
  }));
  return {
    players,
    mode,
    turn: players.findIndex((p) => p.hand.some((c) => c.role === "president")),
    round: 1,
    phase: null,
    embalming: [],
    discarded: [],
    log: ["旧校舍的门关上了。学生会长所在的小组先行动。"],
    result: null,
  };
}
export function settle(g: Game): Result {
  const points = g.embalming.reduce((n, c) => n + cards[c.role].point, 0),
    threshold = 12 - g.players.length;
  const suspicion = Object.fromEntries(
    g.players.map((p) => {
      const n = p.suspicion.reduce((s, c) => s + cards[c.role].point, 0);
      return [p.id, g.mode === "basic" ? Math.max(0, n) : n];
    }),
  );
  const max = Math.max(...Object.values(suspicion));
  const jailed = Object.values(suspicion).every((v) => v === max)
    ? []
    : g.players.filter((p) => suspicion[p.id] === max).map((p) => p.id);
  const ids = (roles: Role[]) =>
    g.players.filter((p) => roles.includes(p.hand[0].role)).map((p) => p.id);
  let winners = ids(["alien"]).filter((id) => jailed.includes(id)),
    reason = "外星人被监禁";
  if (!winners.length) {
    winners = points < threshold ? ids(["infected"]) : [];
    reason = "调和失败，感染者获胜";
  }
  if (!winners.length) {
    winners = ids(["criminal"]).filter((id) => !jailed.includes(id));
    if (winners.length) winners.push(...ids(["accomplice"]));
    reason = "犯人逃脱了监禁";
  }
  if (!winners.length) {
    winners =
      points >= threshold
        ? ids([
            "president",
            "nurse",
            "librarian",
            "prefect",
            "lady",
            "press",
            "leader",
            "honor",
          ])
        : [];
    reason = "调和成功，普通学生获胜";
  }
  if (!winners.length) {
    winners = ids(["home"]);
    reason = winners.length
      ? "无人达成更高顺位条件，归宅部获胜"
      : "无人达成胜利条件";
  }
  return { winners, reason, points, threshold, suspicion, jailed };
}
function finishTurn(g: Game) {
  g.phase = null;
  const actor = g.players[g.turn];
  if (actor.hand.length === 1) actor.locked = true;
  if (g.players.every((p) => p.hand.length === 1)) {
    g.result = settle(g);
    g.log.push(g.result.reason);
    return;
  }
  for (let i = 0; i < g.players.length; i++) {
    g.turn = (g.turn + 1) % g.players.length;
    if (g.turn === 0) g.round++;
    const p = g.players[g.turn];
    if (p.hand.length > 1) {
      p.locked = false;
      if (p.drawLater) {
        p.drawLater = false;
        if (g.embalming.length) g.phase = { kind: "draw", actor: p.id };
      }
      return;
    }
  }
}
export function choicesFor(g: Game, pid: string): Choice[] {
  if (g.result) return [];
  const p = get(g, pid),
    out: Choice[] = [];
  const add = (action: Action, label: string) => out.push({ action, label });
  const phase = g.phase;
  const others = g.players.filter((t) => t.id !== pid && movable(g, t));
  if (!phase) {
    if (g.players[g.turn].id !== pid || p.hand.length < 2) return [];
    for (const c of p.hand) {
      if (c.role === "criminal") continue;
      add({ type: "embalm", card: c.id }, `调和 · ${name(c)}`);
      add({ type: "play", card: c.id }, `发动 · ${name(c)}`);
      for (const t of g.players)
        if (t.id !== pid || g.mode === "advanced")
          add(
            { type: "suspect", card: c.id, target: t.id },
            `质疑 ${t.name} · ${name(c)}`,
          );
    }
    return out;
  }
  const { kind, actor } = phase;
  if (kind === "exchange" || kind === "pass" || kind === "declare") {
    if (!phase.participants?.includes(pid) || phase.choices?.[pid]) return [];
    if (kind === "declare") {
      const criminal = p.hand.some((c) => c.role === "criminal"),
        alien = p.hand.some((c) => c.role === "alien");
      if (!criminal) add({ type: "respond", declare: false }, "不声明");
      if (criminal || alien)
        add(
          { type: "respond", declare: true },
          criminal ? "声明持有犯人" : "以外星人冒充犯人",
        );
    } else
      for (const c of p.hand)
        add({ type: "respond", card: c.id }, `选择 ${name(c)}`);
    return out;
  }
  if (actor !== pid) return [];
  switch (kind) {
    case "nurse":
      for (const c of g.discarded.filter((c) => c.role !== "nurse"))
        add({ type: "resolve", card: c.id }, `回收 ${name(c)}`);
      break;
    case "nurse-discard":
      if (p.hand.length > 0)
        for (const c of p.hand.filter((c) => c.role !== "criminal"))
          add({ type: "resolve", card: c.id }, `弃掉 ${name(c)}`);
      break;
    case "prefect":
      for (const t of g.players.filter((t) => t.id !== pid))
        add({ type: "resolve", target: t.id }, `查看 ${t.name} 的手牌`);
      break;
    case "leader":
      for (const t of others)
        add({ type: "resolve", target: t.id }, `与 ${t.name} 交换`);
      break;
    case "lady":
      for (const t of others)
        t.hand.forEach((_, index) =>
          add(
            { type: "resolve", target: t.id, index },
            `抽取 ${t.name} 的第 ${index + 1} 张手牌`,
          ),
        );
      break;
    case "lady-give":
      for (const c of p.hand)
        add({ type: "resolve", card: c.id }, `交还 ${name(c)}`);
      break;
    case "home":
      for (const c of p.hand)
        g.embalming.forEach((_, index) =>
          add(
            { type: "resolve", card: c.id, index },
            `用 ${name(c)} 换第 ${index + 1} 张调和牌`,
          ),
        );
      break;
    case "accomplice":
      for (const t of g.players)
        t.suspicion.forEach((_, index) => {
          for (const dest of g.players)
            if (dest.id !== t.id)
              add(
                { type: "resolve", target: t.id, other: dest.id, index },
                `把 ${t.name} 的第 ${index + 1} 张质疑移给 ${dest.name}`,
              );
        });
      break;
    case "draw":
      g.embalming.forEach((_, index) =>
        add({ type: "resolve", index }, `取走第 ${index + 1} 张调和牌`),
      );
      break;
  }
  return out;
}
function beginAbility(g: Game, p: Player, role: Role) {
  if (role === "librarian") {
    note(
      p,
      `第 ${g.round} 轮调和区快照：${g.embalming.map(name).join("、") || "空"}。`,
    );
    finishTurn(g);
    return;
  }
  if (role === "infected") {
    p.drawLater = true;
    finishTurn(g);
    return;
  }
  if (role === "president" || role === "alien") {
    finishTurn(g);
    return;
  }
  if (role === "honor" || role === "press") {
    const participants = g.players
      .filter((t) => role === "honor" || movable(g, t))
      .map((t) => t.id);
    if (participants.length < 2 && role === "press") {
      finishTurn(g);
      return;
    }
    g.phase = {
      kind: role === "honor" ? "declare" : "pass",
      actor: p.id,
      participants,
      choices: {},
    };
    return;
  }
  g.phase = {
    kind: role === "nurse" && g.mode === "advanced" ? "nurse-discard" : role,
    actor: p.id,
  };
  if (role === "nurse" && !g.discarded.some((c) => c.role !== "nurse")) {
    finishTurn(g);
    return;
  }
  if (!choicesFor(g, p.id).length) finishTurn(g);
}
function execute(g: Game, pid: string, a: Action) {
  const p = get(g, pid),
    phase = g.phase;
  if (!phase) {
    const c = take(p.hand, a.card);
    if (a.type === "embalm") {
      g.embalming.push(c);
      g.log.push(`${p.name} 放置了一张调和牌。`);
      finishTurn(g);
    } else if (a.type === "suspect") {
      const t = get(g, a.target!);
      t.suspicion.push(c);
      g.log.push(`${p.name} 质疑了 ${t.name}。`);
      finishTurn(g);
    } else {
      g.discarded.push(c);
      g.log.push(`${p.name} 发动了「${name(c)}」。`);
      beginAbility(g, p, c.role);
    }
    return;
  }
  if (a.type === "respond") {
    phase.choices![pid] = a;
    if (!phase.participants!.every((id) => phase.choices![id])) return;
    const ids = phase.participants!;
    if (phase.kind === "declare")
      note(
        get(g, phase.actor),
        `第 ${g.round} 轮犯人声明：${
          ids
            .filter((id) => phase.choices![id].declare)
            .map((id) => get(g, id).name)
            .join("、") || "无人"
        }（可能包含外星人）。`,
      );
    else {
      const picked = ids.map((id) =>
        take(get(g, id).hand, phase.choices![id].card),
      );
      ids.forEach((id, i) =>
        get(g, ids[(i + 1) % ids.length]).hand.push(picked[i]),
      );
      for (const id of ids)
        if (get(g, id).hand.length > 1) get(g, id).locked = false;
    }
    g.log.push(
      phase.kind === "declare"
        ? "调查已完成，线索仅对发动者可见。"
        : "所有选择已提交，卡牌同时移交。",
    );
    finishTurn(g);
    return;
  }
  switch (phase.kind) {
    case "nurse-discard":
      g.discarded.push(take(p.hand, a.card));
      g.phase = { kind: "nurse", actor: pid };
      return;
    case "nurse":
      p.hand.push(take(g.discarded, a.card));
      break;
    case "prefect":
      note(
        p,
        `第 ${g.round} 轮 ${get(g, a.target!).name} 的手牌快照：${get(g, a.target!).hand.map(name).join("、")}。`,
      );
      break;
    case "leader":
      g.phase = {
        kind: "exchange",
        actor: pid,
        participants: [pid, a.target!],
        choices: {},
      };
      return;
    case "lady":
      p.hand.push(get(g, a.target!).hand.splice(a.index!, 1)[0]);
      g.phase = { kind: "lady-give", actor: pid, target: a.target };
      return;
    case "lady-give":
      get(g, phase.target!).hand.push(take(p.hand, a.card));
      break;
    case "home": {
      const c = take(p.hand, a.card);
      p.hand.push(g.embalming.splice(a.index!, 1, c)[0]);
      break;
    }
    case "accomplice":
      get(g, a.other!).suspicion.push(
        get(g, a.target!).suspicion.splice(a.index!, 1)[0],
      );
      break;
    case "draw":
      p.hand.push(g.embalming.splice(a.index!, 1)[0]);
      g.phase = null;
      g.log.push(`${p.name} 取回一张调和牌，继续行动。`);
      return;
  }
  finishTurn(g);
}
export function actionKey(a: Action) {
  return JSON.stringify([
    a.type,
    a.card,
    a.target,
    a.other,
    a.index,
    a.declare,
  ]);
}
export function move(game: Game, pid: string, action: Action): Game {
  const valid = choicesFor(game, pid).some(
    (c) => actionKey(c.action) === actionKey(action),
  );
  if (!valid) fail("此操作已失效，或当前不允许这样行动");
  const next = structuredClone(game);
  execute(next, pid, action);
  next.log = next.log.slice(-60);
  return next;
}
export function viewFor(g: Game, pid: string) {
  const p = get(g, pid);
  return {
    mode: g.mode,
    turn: g.players[g.turn].id,
    round: g.round,
    phase: g.phase
      ? {
          kind: g.phase.kind,
          actor: g.phase.actor,
          waiting: g.phase.participants?.filter(
            (id) => !g.phase!.choices?.[id],
          ) ?? [g.phase.actor],
        }
      : null,
    players: g.players.map((t) => ({
      id: t.id,
      name: t.name,
      count: t.hand.length,
      locked: g.mode === "basic" && t.locked,
      suspicion: t.suspicion.length,
      identity: g.result ? t.hand[0] : null,
    })),
    hand: p.hand,
    notes: p.notes,
    embalming: g.embalming.map((c, index) =>
      g.result ? c : { id: `hidden-${index}` },
    ),
    discarded: g.discarded,
    log: g.log,
    result: g.result,
    choices: choicesFor(g, pid),
  };
}
export type GameView = ReturnType<typeof viewFor>;

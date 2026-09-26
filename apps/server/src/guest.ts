import { randomBytes, randomUUID } from "node:crypto";
// Guest transport identity only. Replace this adapter when account auth is introduced.
export type Guest = {
  id: string;
  token: string;
  name: string;
  room: string | null;
  seen: number;
};
export class GuestIdentity {
  private guests = new Map<string, Guest>();
  resolve(token: unknown, name: unknown): Guest {
    if (typeof token === "string" && token) {
      const found = this.guests.get(token);
      if (found) {
        found.seen = Date.now();
        return found;
      }
    }
    if (this.guests.size >= 2000) throw new Error("访客名额已满，请稍后重试");
    const guest = {
      id: randomUUID(),
      token: randomBytes(32).toString("base64url"),
      name: this.name(name),
      room: null,
      seen: Date.now(),
    };
    this.guests.set(guest.token, guest);
    return guest;
  }
  name(value: unknown) {
    if (typeof value !== "string") return "无名来客";
    return (
      value
        .replace(/[\p{Cc}\p{Cf}]/gu, "")
        .trim()
        .slice(0, 16) || "无名来客"
    );
  }
  prune() {
    for (const [token, g] of this.guests)
      if (!g.room && Date.now() - g.seen > 86400000) this.guests.delete(token);
  }
}

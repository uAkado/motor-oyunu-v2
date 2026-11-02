export interface GNode { n: string; x: number; y: number }
export interface Edge { a: number; b: number; i: number; len: number; seed: number; br?: string }
export type RouteKey = "km" | "min" | "fuel";
export interface RouteDef { key: RouteKey; name: string; c: string; pro: string; con: string }

export const FUEL_TL = 46;

export const N: GNode[] = [
  { n: "Sarıyer", x: 500, y: 70 }, { n: "Şişli", x: 330, y: 170 }, { n: "Beşiktaş", x: 450, y: 250 },
  { n: "Beyoğlu", x: 360, y: 350 }, { n: "Fatih", x: 240, y: 430 }, { n: "Üsküdar", x: 610, y: 340 },
  { n: "Kadıköy", x: 640, y: 470 }, { n: "Ümraniye", x: 780, y: 260 }, { n: "Ataşehir", x: 800, y: 400 },
  { n: "Beykoz", x: 680, y: 110 },
];

const BR: Record<string, string> = { "0-9": "FSM Köprüsü", "2-5": "15 Temmuz Köprüsü", "4-6": "Marmaray" };
const PAIRS: [number, number][] = [
  [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [0, 9], [2, 5], [4, 6], [9, 7], [5, 7], [5, 6], [6, 8], [7, 8], [5, 8],
];

export const E: Edge[] = PAIRS.map(([a, b], i) => ({
  a, b, i,
  len: Math.hypot(N[a].x - N[b].x, N[a].y - N[b].y) * 0.034,
  seed: Math.random(),
  br: BR[`${a}-${b}`],
}));

export const DEFS: RouteDef[] = [
  { key: "km", name: "Rota 1 · En kısa yol", c: "#3b82f6", pro: "Mesafe en az", con: "Trafik yoğun olabilir" },
  { key: "min", name: "Rota 2 · En hızlı yol", c: "#e879f9", pro: "Varış süresi en düşük", con: "Daha uzun ve yakıt farklı olabilir" },
  { key: "fuel", name: "Rota 3 · Ekonomik yol", c: "#14b8a6", pro: "Yakıt ve maliyet en az", con: "Süre daha uzun olabilir" },
];

export const eOf = (u: number, v: number): Edge =>
  E.find((e) => (e.a === u && e.b === v) || (e.b === u && e.a === v)) as Edge;

const g = (h: number, c: number, w: number) => Math.exp(-(((h - c) / w) ** 2));

/** Senaryoya dayalı trafik yoğunluğu (0–1). Gerçek zamanlı veri değildir. */
export function traffic(e: Edge, h: number, jams: number[]): number {
  if (jams.includes(e.i)) return 0.97;
  const peak = Math.max(g(h, 9, 1.6), g(h, 18.5, 2.1), 0.35 * g(h, 13, 1.5));
  const t = 0.1 + 0.68 * peak + (e.br ? 0.14 : 0) + Math.sin(h * 1.3 + e.seed * 6) * 0.1 + (e.seed - 0.5) * 0.12;
  return Math.min(0.98, Math.max(0.05, t));
}
export const col = (t: number) => (t < 0.35 ? "#22c55e" : t < 0.65 ? "#f59e0b" : "#ef4444");
export const label = (t: number) => (t < 0.35 ? "Akıcı" : t < 0.65 ? "Orta" : "Yoğun");
export const mins = (e: Edge, h: number, j: number[]) => (e.len / (45 * (1 - 0.65 * traffic(e, h, j)))) * 60;
export const fuelOf = (e: Edge, h: number, j: number[]) => e.len * 0.04 * (1 + 0.3 * traffic(e, h, j));
export const direct = (a: number, b: number) => Math.hypot(N[a].x - N[b].x, N[a].y - N[b].y) * 0.034;
export const fmt = (h: number) => {
  const m = Math.round((((h % 24) + 24) % 24) * 60) % 1440;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
};

import { N, E, DEFS, Edge, mins, fuelOf, traffic } from "./data";

export interface Route {
  nodes: number[]; edges: Edge[];
  km: number; min: number; fuel: number; tr: number;
  def: number; alt: boolean; p: number;
}

function allPaths(from: number, to: number): { nodes: number[]; edges: Edge[] }[] {
  const out: { nodes: number[]; edges: Edge[] }[] = [];
  const vis: boolean[] = Array(N.length).fill(false);
  const dfs = (u: number, ns: number[], es: Edge[]) => {
    if (u === to) { out.push({ nodes: [...ns], edges: [...es] }); return; }
    if (ns.length > 8) return;
    vis[u] = true;
    for (const e of E) {
      if (e.a !== u && e.b !== u) continue;
      const v = e.a === u ? e.b : e.a;
      if (vis[v]) continue;
      ns.push(v); es.push(e); dfs(v, ns, es); ns.pop(); es.pop();
    }
    vis[u] = false;
  };
  dfs(from, [from], []);
  return out;
}

function stat(p: { nodes: number[]; edges: Edge[] }, h: number, j: number[]): Route {
  const km = p.edges.reduce((s, e) => s + e.len, 0);
  return {
    ...p, km,
    min: p.edges.reduce((s, e) => s + mins(e, h, j), 0),
    fuel: p.edges.reduce((s, e) => s + fuelOf(e, h, j), 0),
    tr: p.edges.reduce((s, e) => s + traffic(e, h, j) * e.len, 0) / km,
    def: 0, alt: false, p: 0,
  };
}

function sim(a: Route, b: Route): number {
  const A = new Set(a.edges.map((e) => e.i)), B = new Set(b.edges.map((e) => e.i));
  let n = 0;
  A.forEach((i) => { if (B.has(i)) n++; });
  return n / (A.size + B.size - n);
}

/** Birbirinden farklı en fazla 3 rota üretir; üretilemeyen sayısı `missing` olarak döner. */
export function build(from: number, to: number, h: number, jams: number[], deadline?: number) {
  const P = from === to ? [] : allPaths(from, to).map((p) => stat(p, h, jams));
  if (!P.length) return { list: [] as Route[], missing: 3, dl: deadline ?? 10 };
  const gMin = Math.min(...P.map((p) => p.min));
  const dl = deadline ?? Math.round(gMin * 1.25 + 3);
  const chosen: Route[] = [];
  DEFS.forEach((d, di) => {
    const s = P.slice().sort((a, b) => a[d.key] - b[d.key]);
    let pick: Route | undefined;
    for (const th of [0.5, 0.7, 0.85]) {
      pick = s.find((p) => chosen.every((c) => sim(p, c) <= th));
      if (pick) break;
    }
    if (!pick) return;
    pick.def = di;
    pick.alt = pick[d.key] > s[0][d.key] + 1e-9;
    chosen.push(pick);
  });
  chosen.forEach((r) => {
    r.p = Math.round(100 / (1 + Math.exp((r.min - dl) / (dl * (0.05 + 0.12 * r.tr)))));
  });
  return { list: chosen, missing: 3 - chosen.length, dl };
}

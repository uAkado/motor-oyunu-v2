import { useRef, useState } from "react";
import { N, E, DEFS, FUEL_TL, eOf, mins, fuelOf, traffic, direct, fmt } from "./game/data";
import { build, Route } from "./game/routing";
import MapView from "./components/MapView";
import Cards from "./components/Cards";

export type Phase = "offer" | "choose" | "trip" | "reroute";
export interface Order { from: number; to: number; deadline: number }
interface Trip {
  nodes: number[]; i: number; min: number; fuel: number; rer: number;
  color: string; t0: Record<number, number>; inc: number;
}

function makeOrder(from: number, h: number): Order {
  let to = (from + 1) % N.length, dl = 10;
  for (let k = 0; k < 60; k++) {
    const t = Math.floor(Math.random() * N.length);
    if (t === from) continue;
    const b = build(from, t, h, []);
    to = t; dl = b.dl;
    if (b.missing === 0) break;
  }
  return { from, to, deadline: dl };
}
const payOf = (o: Order) => Math.round(40 + 8 * direct(o.from, o.to));

export default function App() {
  const [h, setHs] = useState(8.5);
  const hRef = useRef(8.5);
  const setH = (v: number) => { hRef.current = v; setHs(v); };
  const [bal, setBal] = useState(0);
  const [cnt, setCnt] = useState(0);
  const [cur, setCurS] = useState(3);
  const curRef = useRef(3);
  const setCur = (v: number) => { curRef.current = v; setCurS(v); };
  const [order, setOrderS] = useState<Order>(() => makeOrder(3, 8.5));
  const orderRef = useRef<Order>(order);
  const setOrder = (o: Order) => { orderRef.current = o; setOrderS(o); };
  const [routes, setRoutes] = useState<Route[]>([]);
  const [missing, setMissing] = useState(0);
  const [sel, setSel] = useState(-1);
  const [phase, setPhase] = useState<Phase>("offer");
  const [jams, setJamsS] = useState<number[]>([]);
  const jamsRef = useRef<number[]>([]);
  const setJams = (v: number[]) => { jamsRef.current = v; setJamsS(v); };
  const [toast, setToast] = useState("");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [view, setView] = useState<{ nodes: number[]; color: string; min: number }>({ nodes: [], color: "#f97316", min: 0 });
  const tripRef = useRef<Trip | null>(null);

  const syncView = () => {
    const t = tripRef.current;
    if (t) setView({ nodes: t.nodes.slice(t.i), color: t.color, min: t.min });
  };

  const nextOrder = (from: number) => {
    setOrder(makeOrder(from, hRef.current));
    setJams([]); setRoutes([]); setSel(-1); setPos(null); setPhase("offer");
  };

  const accept = () => {
    const b = build(curRef.current, order.to, hRef.current, jamsRef.current);
    setRoutes(b.list); setMissing(b.missing);
    setOrder({ ...order, deadline: b.dl });
    setSel(-1); setPhase("choose");
  };

  const showAlts = () => {
    const t = tripRef.current!, o = orderRef.current;
    const rem = Math.max(5, o.deadline - t.min);
    const b = build(curRef.current, o.to, hRef.current, jamsRef.current, Math.round(rem));
    setRoutes(b.list); setMissing(b.missing); setSel(-1); setPos(null); setPhase("reroute");
  };

  const arrive = (t: Trip) => {
    const o = orderRef.current;
    const late = t.min > o.deadline, pay = payOf(o), gross = late ? pay * 0.5 : pay, cost = t.fuel * FUEL_TL, net = gross - cost;
    setBal((b) => b + net); setCnt((c) => c + 1);
    setToast((late ? `Geç teslim (${Math.round(t.min)} dk / sınır ${o.deadline} dk), ücret yarıya düştü. ` : `Zamanında teslim (${Math.round(t.min)} dk). `) +
      `Ücret ${Math.round(gross)} ₺, yakıt ${Math.round(cost)} ₺, net ${Math.round(net)} ₺.`);
    tripRef.current = null;
    setCur(o.to);
    nextOrder(o.to);
  };

  const runSeg = () => {
    const t = tripRef.current!;
    const u = t.nodes[t.i], v = t.nodes[t.i + 1], e = eOf(u, v), A = N[u], B = N[v];
    const m = mins(e, hRef.current, jamsRef.current), f = fuelOf(e, hRef.current, jamsRef.current);
    const t0 = performance.now(), dur = 700 + e.len * 80, h0 = hRef.current;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setPos({ x: A.x + (B.x - A.x) * p, y: A.y + (B.y - A.y) * p });
      setH(h0 + (m / 60) * p);
      if (p < 1) { requestAnimationFrame(step); return; }
      t.min += m; t.fuel += f; t.i++;
      setCur(v);
      if (t.i === t.nodes.length - 1) { arrive(t); return; }
      const nx = eOf(v, t.nodes[t.i + 1]);
      syncView();
      if (t.i === t.inc) {
        t.inc = -1;
        setJams([...jamsRef.current, nx.i]);
        setToast(`Kaza: ${N[v].n}–${N[t.nodes[t.i + 1]].n} arası kapandı, trafik kırmızı!`);
        showAlts(); return;
      }
      if (t.rer < 2 && traffic(nx, hRef.current, jamsRef.current) >= 0.65 && (t.t0[nx.i] ?? 0) < 0.65) {
        setToast("Önündeki yolda trafik kırmızıya döndü!");
        showAlts(); return;
      }
      runSeg();
    };
    requestAnimationFrame(step);
  };

  const go = () => {
    if (sel < 0) return;
    const r = routes[sel];
    if (phase === "choose") {
      tripRef.current = {
        nodes: r.nodes.slice(), i: 0, min: 0, fuel: 0, rer: 0, color: DEFS[r.def].c, t0: {},
        inc: r.nodes.length >= 3 && Math.random() < 0.8 ? 1 + Math.floor(Math.random() * (r.nodes.length - 2)) : -1,
      };
    } else {
      const t = tripRef.current!;
      t.nodes = t.nodes.slice(0, t.i + 1).concat(r.nodes.slice(1));
      t.color = DEFS[r.def].c; t.rer++;
    }
    const t = tripRef.current!;
    r.edges.forEach((e) => { t.t0[e.i] = traffic(e, hRef.current, jamsRef.current); });
    setPhase("trip"); setToast("Motokurye seçtiğin rotada yolda…"); syncView(); runSeg();
  };

  const stay = () => { setPhase("trip"); setToast("Mevcut rotada devam ediyorsun."); syncView(); runSeg(); };

  const onHour = (v: number) => {
    setH(v);
    if (phase === "choose") {
      const b = build(curRef.current, order.to, v, jamsRef.current);
      setRoutes(b.list); setMissing(b.missing); setOrder({ ...order, deadline: b.dl }); setSel(-1);
    }
  };

  const busy = phase === "trip" || phase === "reroute";
  return (
    <>
      <header>
        <h1>🏍️ Motokurye İstanbul <small style={{ color: "var(--mute)", fontWeight: 400 }}>· 3 rota karar sistemi</small></h1>
        <div className="stat">Gün<b>1 / 365</b></div>
        <div className="stat">Saat<b>{fmt(h)}</b></div>
        <div className="stat">Saati değiştir
          <input type="range" min={0} max={23.75} step={0.25} value={Math.min(23.75, h % 24)} disabled={busy}
            onChange={(e) => onHour(Number(e.target.value))} aria-label="Günün saati" />
        </div>
        <div className="stat">Hava<b>☀️ Açık</b></div>
        <div className="stat">Net kazanç<b>{Math.round(bal)} ₺</b></div>
        <div className="stat">Teslimat<b>{cnt}</b></div>
      </header>
      <main>
        <aside>
          <h2>Sipariş</h2>
          <div className="order">
            <div className="big">{N[cur].n} → {N[order.to].n}</div>
            <div style={{ color: "var(--mute)" }}>Süre sınırı: <b style={{ color: "var(--ink)" }}>{order.deadline} dk</b> · Ücret: <b style={{ color: "var(--ink)" }}>{payOf(order)} ₺</b></div>
            {phase === "offer" && (
              <div className="row">
                <button className="btn ok" onClick={accept}>Kabul et</button>
                <button className="btn no" onClick={() => nextOrder(cur)}>Reddet</button>
              </div>
            )}
          </div>
          <div className="toast">{toast}</div>
          <h2>Kural</h2>
          <p style={{ color: "var(--mute)", margin: 0 }}>Her siparişte birbirinden farklı tam 3 rota üretilir. Rota seçmeden yola çıkılamaz. Yolda trafik kırmızıya dönerse 3 yeni seçenek sunulur.</p>
        </aside>
        <section className="mapwrap">
          <MapView h={h} jams={jams} order={order} cur={cur} routes={routes} sel={sel} phase={phase}
            tripNodes={view.nodes} tripColor={view.color} pos={pos} onSelect={setSel}
            trafficOf={(i) => traffic(E[i], h, jams)} />
          <div className="legend">
            <span><i style={{ background: "#22c55e" }} />Akıcı</span>
            <span><i style={{ background: "#f59e0b" }} />Orta</span>
            <span><i style={{ background: "#ef4444" }} />Yoğun</span>
          </div>
          <div className="note">Şematik harita. Trafik gerçek zamanlı değil, senaryoya dayalı simülasyondur.</div>
        </section>
      </main>
      <Cards phase={phase} routes={routes} sel={sel} missing={missing} pay={payOf(order)} order={order}
        tripMin={view.min} tripNodes={view.nodes} onSelect={setSel} onGo={go} onStay={stay} />
    </>
  );
}

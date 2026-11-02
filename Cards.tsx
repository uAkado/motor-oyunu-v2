import { N, DEFS, FUEL_TL, col, label } from "../game/data";
import { Route } from "../game/routing";
import type { Phase, Order } from "../App";

interface Props {
  phase: Phase; routes: Route[]; sel: number; missing: number; pay: number;
  order: Order; tripMin: number; tripNodes: number[];
  onSelect: (i: number) => void; onGo: () => void; onStay: () => void;
}

export default function Cards({ phase, routes, sel, missing, pay, order, tripMin, tripNodes, onSelect, onGo, onStay }: Props) {
  if (phase === "offer")
    return <footer><div className="hint">Siparişi kabul edince birbirinden farklı 3 rota hesaplanacak.</div></footer>;
  if (phase === "trip")
    return (
      <footer>
        <div className="hint">Yoldasın: {tripNodes.map((i) => N[i].n).join(" › ")} · Geçen süre {Math.round(tripMin)} dk / sınır {order.deadline} dk</div>
      </footer>
    );
  return (
    <footer>
      <div className="cards">
        {phase === "reroute" && (
          <div className="hint warn" style={{ flex: "1 1 100%", padding: 0 }}>⚠️ Trafik değişti! Güncel 3 alternatif:</div>
        )}
        {routes.map((r, i) => {
          const d = DEFS[r.def], net = Math.round(pay - r.fuel * FUEL_TL), on = i === sel;
          return (
            <button key={i} className="card" onClick={() => onSelect(i)}
              style={{ borderColor: on ? d.c : undefined, boxShadow: on ? `0 0 0 2px ${d.c}55` : "none" }}>
              <b style={{ color: d.c }}>{d.name}{r.alt ? " (en iyi eşdeğer)" : ""}</b>
              <small>{r.km.toFixed(1)} km · {Math.round(r.min)} dk · {r.fuel.toFixed(2)} L</small>
              <small><span style={{ color: col(r.tr) }}>●</span> Trafik: {label(r.tr)} · Zamanında: %{r.p}</small>
              <small>Kazanç: {pay} ₺ · yakıt sonrası ~{net} ₺</small>
              <small>+ {d.pro} / − {d.con}</small>
              <small>{r.nodes.map((n) => N[n].n).join(" › ")}</small>
            </button>
          );
        })}
        {missing > 0 && (
          <div className="hint warn">Bu güzergâh için gerçek yol ağında yalnızca {3 - missing} birbirinden farklı rota üretilebildi. Aynı rota tekrar gösterilmedi.</div>
        )}
      </div>
      <div className="side">
        <button className="go" disabled={sel < 0} onClick={onGo}>{phase === "reroute" ? "Bu rotaya geç" : "Yola Çık"}</button>
        {phase === "reroute" && <button className="stay" onClick={onStay}>Mevcut rotada kal</button>}
      </div>
    </footer>
  );
}

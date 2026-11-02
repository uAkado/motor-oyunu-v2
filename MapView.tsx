import { N, E, DEFS, col } from "../game/data";
import { Route } from "../game/routing";
import type { Phase, Order } from "../App";

interface Props {
  h: number; jams: number[]; order: Order; cur: number;
  routes: Route[]; sel: number; phase: Phase;
  tripNodes: number[]; tripColor: string;
  pos: { x: number; y: number } | null;
  onSelect: (i: number) => void;
  trafficOf: (i: number) => number;
}

export default function MapView({ jams, order, cur, routes, sel, phase, tripNodes, tripColor, pos, onSelect, trafficOf }: Props) {
  const mp = pos ?? N[cur];
  const showRoutes = phase === "choose" || phase === "reroute";
  const ordered = routes.map((_, i) => i).sort((a, b) => Number(a === sel) - Number(b === sel));
  return (
    <div className="stage">
      <svg className="map" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet" role="img" aria-label="İstanbul şematik haritası">
        <path d="M0 0H560L520 60 470 130 500 200 470 270 420 340 330 420 300 500 0 640Z" fill="var(--land)" />
        <path d="M1000 0H680L650 60 600 150 590 260 570 320 540 390 600 520 640 640H1000Z" fill="var(--land)" />
        <text x={540} y={200} fill="var(--mute)" fontSize={13} textAnchor="middle" transform="rotate(80 540 200)">B O Ğ A Z</text>
        <text x={480} y={580} fill="var(--mute)" fontSize={13} textAnchor="middle">Marmara Denizi</text>
        <text x={150} y={150} fill="var(--mute)" fontSize={14} textAnchor="middle">AVRUPA YAKASI</text>
        <text x={880} y={150} fill="var(--mute)" fontSize={14} textAnchor="middle">ANADOLU YAKASI</text>

        {E.map((e) => {
          const A = N[e.a], B = N[e.b], jam = jams.includes(e.i);
          return (
            <g key={e.i}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--road)" strokeWidth={e.br ? 13 : 11} strokeLinecap="round" />
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col(trafficOf(e.i))} strokeWidth={e.br ? 6 : 5} strokeLinecap="round" />
              {jam && <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 + 5} fontSize={18} textAnchor="middle">⚠️</text>}
              {e.br && <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 12} fill="var(--ink)" fontSize={11} textAnchor="middle">{e.br}</text>}
            </g>
          );
        })}

        {phase === "trip" && tripNodes.length > 1 && (
          <polyline points={tripNodes.map((i) => `${N[i].x},${N[i].y}`).join(" ")} fill="none" stroke={tripColor} strokeWidth={9} opacity={0.9} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {showRoutes && ordered.map((ri) => {
          const r = routes[ri], on = ri === sel, off = (r.def - 1) * 7, c = DEFS[r.def].c;
          const k = Math.floor((r.nodes.length - 2) / 2);
          const A = N[r.nodes[k]], B = N[r.nodes[k + 1]], L = Math.hypot(B.x - A.x, B.y - A.y);
          const bx = (A.x + B.x) / 2 - ((B.y - A.y) / L) * off * 2.2, by = (A.y + B.y) / 2 + ((B.x - A.x) / L) * off * 2.2;
          return (
            <g key={ri}>
              {r.nodes.slice(0, -1).map((u, s) => {
                const P = N[u], Q = N[r.nodes[s + 1]], l = Math.hypot(Q.x - P.x, Q.y - P.y);
                const nx = (-(Q.y - P.y) / l) * off, ny = ((Q.x - P.x) / l) * off;
                return <line key={s} x1={P.x + nx} y1={P.y + ny} x2={Q.x + nx} y2={Q.y + ny} stroke={c} strokeWidth={on ? 8 : 4} opacity={sel < 0 || on ? 0.95 : 0.45} strokeLinecap="round" />;
              })}
              <g style={{ cursor: "pointer" }} onClick={() => onSelect(ri)}>
                <circle cx={bx} cy={by} r={on ? 14 : 11} fill={c} stroke="#fff" strokeWidth={2} />
                <text x={bx} y={by + 5} fill="#fff" fontSize={13} fontWeight={700} textAnchor="middle">{r.def + 1}</text>
              </g>
            </g>
          );
        })}

        {N.map((n, i) => {
          const d = order.to === i;
          return (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={d ? 13 : 8} fill={d ? "#ef4444" : "var(--panel)"} stroke={d ? "#fff" : "var(--mute)"} strokeWidth={2} />
              {d && (
                <circle cx={n.x} cy={n.y} r={13} fill="none" stroke="#ef4444" strokeWidth={2}>
                  <animate attributeName="r" values="13;30" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              <text x={n.x} y={n.y - (d ? 20 : 14)} fill="var(--ink)" fontSize={13} fontWeight={d || cur === i ? 700 : 400} textAnchor="middle">{n.n + (d ? " 📦" : "")}</text>
            </g>
          );
        })}

        <g transform={`translate(${mp.x} ${mp.y})`}>
          <circle r={15} fill="#f97316" stroke="#fff" strokeWidth={2.5} />
          <text y={6} fontSize={17} textAnchor="middle">🏍️</text>
        </g>
      </svg>
    </div>
  );
}

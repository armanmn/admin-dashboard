"use client";
import React, { useMemo, useState, useEffect } from "react";

const wrap = {
  position: "fixed",
  inset: 0,
  background: "rgba(17,24,39,0.45)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};
const card = {
  width: "min(720px, 92vw)",
  maxHeight: "86vh",
  overflow: "auto",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,24,39,0.25)",
  padding: 18,
};
const h = { margin: 0, fontSize: 18, fontWeight: 800 };
const sub = { fontSize: 13, color: "#6b7280", marginTop: 2, marginBottom: 10 };
const row = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };
const box = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fafafa" };
const actions = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 };
const btn = (primary=false)=> ({
  padding: "10px 14px",
  borderRadius: 10,
  border: primary ? "none" : "1px solid #e5e7eb",
  background: primary ? "var(--primary-color, #f36323)" : "#fff",
  color: primary ? "#fff" : "#111827",
  fontWeight: 700,
  cursor: "pointer",
});
const small = { fontSize: 12, color: "#6b7280" };

const clamp = (n,min,max)=> Math.max(min, Math.min(max, Number(n||0)));
const range = (n)=> Array.from({length:n}, (_,i)=> i);

function parseInitial({ rooms=1, adultsCSV="2", childrenCSV="0", childrenAgesCSV="" }) {
  const R = clamp(rooms, 1, 9);
  const A = String(adultsCSV).split(",").map(x => clamp(x, 1, 6));
  const C = String(childrenCSV).split(",").map(x => clamp(x, 0, 6));
  const groups = String(childrenAgesCSV||"")
    .split("|")
    .map(g => String(g||"").split(",").filter(Boolean).map(x => clamp(x, 0, 17)));

  // normalise to R rooms
  const out = [];
  for (let i=0; i<R; i++){
    const a = A[i] ?? A[0] ?? 2;
    const c = C[i] ?? C[0] ?? 0;
    const ages = (groups[i] || []).slice(0, c);
    // fill missing ages with 8yo by default
    while (ages.length < c) ages.push(8);
    out.push({ adults: a, children: c, ages });
  }
  return out;
}

function toQueryParts(roomsArr){
  const rooms = clamp(roomsArr.length, 1, 9);
  const adultsCSV = roomsArr.map(r => clamp(r.adults, 1, 6)).join(",");
  const childrenCSV = roomsArr.map(r => clamp(r.children, 0, 6)).join(",");
  const childrenAgesCSV = roomsArr
    .map(r => (r.ages || []).slice(0, clamp(r.children,0,6)).map(x => clamp(x,0,17)).join(","))
    .join("|");
  return { rooms, adultsCSV, childrenCSV, childrenAgesCSV };
}

export default function RoomPaxEditor({
  open,
  onClose,
  onApply,
  initialRooms = 1,
  initialAdultsCSV = "2",
  initialChildrenCSV = "0",
  initialChildrenAgesCSV = "",
}) {
  const [roomsArr, setRoomsArr] = useState(
    parseInitial({
      rooms: initialRooms,
      adultsCSV: initialAdultsCSV,
      childrenCSV: initialChildrenCSV,
      childrenAgesCSV: initialChildrenAgesCSV,
    })
  );

  // reset when props change (e.g., when opening with different URL params)
  useEffect(() => {
    if (!open) return;
    setRoomsArr(parseInitial({
      rooms: initialRooms,
      adultsCSV: initialAdultsCSV,
      childrenCSV: initialChildrenCSV,
      childrenAgesCSV: initialChildrenAgesCSV,
    }));
  }, [open, initialRooms, initialAdultsCSV, initialChildrenCSV, initialChildrenAgesCSV]);

  const addRoom = () => {
    if (roomsArr.length >= 9) return;
    setRoomsArr(prev => [...prev, { adults: 2, children: 0, ages: [] }]);
  };
  const removeRoom = (idx) => {
    if (roomsArr.length <= 1) return;
    setRoomsArr(prev => prev.filter((_,i)=> i!==idx));
  };

  const setRoom = (idx, patch) => {
    setRoomsArr(prev => {
      const x = prev.slice();
      const cur = { ...x[idx], ...patch };
      // keep ages length in sync with children
      const targetC = clamp(cur.children, 0, 6);
      const ages = (cur.ages || []).slice(0, targetC);
      while (ages.length < targetC) ages.push(8);
      x[idx] = { ...cur, children: targetC, ages };
      return x;
    });
  };

  if (!open) return null;

  return (
    <div style={wrap} onClick={onClose}>
      <div style={card} onClick={(e)=> e.stopPropagation()}>
        <h3 style={h}>Guests & rooms</h3>
        <p style={sub}>Սահմանիր մեծահասակների/երեխաների բաշխումը ըստ սենյակների։</p>

        <div style={{ display: "grid", gap: 10 }}>
          {roomsArr.map((r, idx) => (
            <div key={idx} style={{ ...box }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontWeight: 700 }}>Room {idx+1}</div>
                <button
                  onClick={()=> removeRoom(idx)}
                  style={{ border:"1px solid #e5e7eb", background:"#fff", borderRadius:8, padding:"6px 10px", cursor:"pointer" }}
                  disabled={roomsArr.length<=1}
                >
                  Remove
                </button>
              </div>

              <div style={row}>
                <label>Adults</label>
                <select
                  value={r.adults}
                  onChange={(e)=> setRoom(idx, { adults: clamp(e.target.value, 1, 6) })}
                >
                  {range(6).slice(1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                <label>Children</label>
                <select
                  value={r.children}
                  onChange={(e)=> setRoom(idx, { children: clamp(e.target.value, 0, 6) })}
                >
                  {range(7).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={small}>(ages 0–17)</span>
              </div>

              {r.children>0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color:"#374151", marginBottom: 6 }}>Children ages</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {r.ages.map((age, j)=> (
                      <select
                        key={j}
                        value={age}
                        onChange={(e)=> {
                          const next = roomsArr.slice();
                          const ages = next[idx].ages.slice();
                          ages[j] = clamp(e.target.value, 0, 17);
                          next[idx] = { ...next[idx], ages };
                          setRoomsArr(next);
                        }}
                      >
                        {range(18).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div>
            <button
              onClick={addRoom}
              style={{ border:"1px dashed #e5e7eb", background:"#fff", borderRadius:10, padding:"8px 12px", fontWeight:700, cursor:"pointer" }}
              disabled={roomsArr.length>=9}
            >
              + Add room
            </button>
          </div>
        </div>

        <div style={actions}>
          <button onClick={onClose} style={btn(false)}>Cancel</button>
          <button
            onClick={()=>{
              const qp = toQueryParts(roomsArr);
              onApply?.(qp);
            }}
            style={btn(true)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
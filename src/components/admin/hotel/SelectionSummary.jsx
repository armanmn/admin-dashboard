// "use client";

// import React, { useMemo } from "react";
// import { useSelectionStore } from "@/stores/selectionStore";
// import { fmtMoney } from "@/utils/pricingDisplay";

// /* date helpers */
// const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// const MON_MAP = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
// function toUTC(y,m,d){ return new Date(Date.UTC(y,m,d)); }
// function fmtUTC(d){
//   if(!d || isNaN(d.getTime())) return null;
//   const day = String(d.getUTCDate()).padStart(2,"0");
//   const mon = MONTHS[d.getUTCMonth()];
//   const year = d.getUTCFullYear();
//   return `${day} ${mon} ${year}`;
// }
// function parseDateFlexible(s){
//   if(!s) return null;
//   const iso = new Date(s);
//   if(!isNaN(iso.getTime())) return iso;
//   let m = String(s).match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
//   if(m){ const d=+m[1], mm=+m[2]-1, y=+m[3]; const dt=toUTC(y,mm,d); if(!isNaN(dt)) return dt; }
//   m = String(s).match(/\b(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\b/);
//   if(m){ const d=+m[1], mm=MON_MAP[m[2].toLowerCase()]; const y=+m[3]; if(mm>=0){ const dt=toUTC(y,mm,d); if(!isNaN(dt)) return dt; } }
//   m = String(s).match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
//   if(m){ const y=+m[1], mm=+m[2]-1, d=+m[3]; const dt=toUTC(y,mm,d); if(!isNaN(dt)) return dt; }
//   return null;
// }
// function fmtDateNice(dateLike){
//   const d = typeof dateLike==="string" ? parseDateFlexible(dateLike) : dateLike;
//   return fmtUTC(d);
// }

// const PRIMARY = "#f36323";

// export default function SelectionSummary({
//   arrivalDate,
//   checkOutDate,
//   nights,
//   adults,
//   children,
//   rooms,
//   onCheckAvailability,
// }) {
//   const items = useSelectionStore((s) => s.items);
//   const removeItem = useSelectionStore((s) => s.removeItem);

//   const cutoffAggIso = useMemo(() => {
//     if (!Array.isArray(items) || !items.length) return null;
//     const toTs = (it) => {
//       const a = it?.platformCutoffUtc || it?.cancellation?.platform?.cutoffUtc || null;
//       return a ? +new Date(a) : null;
//     };
//     const ts = items.map(toTs).filter((n) => Number.isFinite(n));
//     if (!ts.length) return null;
//     return new Date(Math.min(...ts)).toISOString();
//   }, [items]);

//   const cutoffAggText = useMemo(() => fmtDateNice(cutoffAggIso), [cutoffAggIso]);

//   const getLine = (it) => {
//     const money = it?.priceRetail || it?.price || null;
//     const amt = Number(money?.amount || 0);
//     const cur = money?.currency || "USD";
//     const qty = Number(it?.qty || 0);
//     return { amt, cur, qty, total: amt * qty };
//   };

//   const displayCurrency = useMemo(() => {
//     const first =
//       items?.find((it) => it?.priceRetail?.currency)?.priceRetail?.currency ||
//       items?.find((it) => it?.price?.currency)?.price?.currency ||
//       "USD";
//     return first;
//   }, [items]);

//   const total = useMemo(() => {
//     if (!Array.isArray(items) || !items.length) return 0;
//     return items.reduce((sum, it) => sum + getLine(it).total, 0);
//   }, [items]);

//   const nonRefundablePolicy = useMemo(
//     () =>
//       Array.isArray(items) &&
//       items.some(
//         (x) =>
//           x?.refundable === false ||
//           x?.cancellation?.platform?.refundable === false
//       ),
//     [items]
//   );

//   /* styles */
//   const cardStyle = {
//     border: "1px solid #e5e7eb",
//     borderRadius: 14,
//     background: "linear-gradient(0deg, #ffffff 0%, #fbfbff 100%)",
//     boxShadow: "0 8px 24px rgba(17,24,39,0.08)",
//     padding: 14,
//     display: "grid",
//     gap: 12,
//     alignSelf: "start",
//   };
//   const lineStyle = {
//     display: "grid",
//     gridTemplateColumns: "1fr auto auto",
//     alignItems: "baseline",
//     gap: 8,
//     border: "1px dashed #e5e7eb",
//     background: "#fcfcfd",
//     borderRadius: 10,
//     padding: "8px 10px",
//   };
//   const removeBtn = {
//     fontSize: 12,
//     color: "#ef4444",
//     border: "1px solid #fecaca",
//     background: "#fff",
//     borderRadius: 8,
//     padding: "2px 8px",
//     cursor: "pointer",
//   };

//   const arriveNice = fmtDateNice(arrivalDate) || "—";
//   const departNice = fmtDateNice(checkOutDate) || "—";

//   return (
//     <div style={cardStyle}>
//       <div style={{ fontWeight: 900, fontSize: 18 }}>Your selection</div>

//       <div style={{ color: "#374151", fontSize: 14 }}>
//         <div style={{ fontWeight: 700 }}>
//           {arriveNice} → {departNice} • {nights} night{nights > 1 ? "s" : ""}
//         </div>
//         <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
//           <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, background: "#eef2ff", border: "1px solid #e5e7eb" }}>
//             🌙 {nights} night{nights > 1 ? "s" : ""}
//           </span>
//           <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, background: "#eef2ff", border: "1px solid #e5e7eb" }}>
//             👤 {adults} adult{adults > 1 ? "s" : ""}
//           </span>
//           <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, background: "#eef2ff", border: "1px solid #e5e7eb" }}>
//             👶 {children} child{children !== 1 ? "ren" : ""}
//           </span>
//           <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, background: "#eef2ff", border: "1px solid #e5e7eb" }}>
//             🛏️ {rooms} room{rooms > 1 ? "s" : ""}
//           </span>
//         </div>
//       </div>

//       {Array.isArray(items) && items.length ? (
//         <div style={{ display: "grid", gap: 8 }}>
//           {items.map((it) => {
//             const { total: lineTotalNum, cur, qty } = (() => {
//               const x = getLine(it);
//               return { total: x.total, cur: x.cur, qty: x.qty };
//             })();

//             return (
//               <div key={it.key} style={lineStyle}>
//                 <div style={{ minWidth: 0 }}>
//                   <div style={{ fontWeight: 800, color: "#111827" }}>
//                     {it.roomName || "Room"}
//                   </div>
//                   <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
//                     {it.board ? (
//                       <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#334155" }}>
//                         {it.board}
//                       </span>
//                     ) : null}
//                     <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
//                       × {qty}
//                     </span>
//                     {it?.cancellation?.platform?.refundable === true &&
//                     (it.platformCutoffUtc || it?.cancellation?.platform?.cutoffUtc) ? (
//                       <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#334155" }}>
//                         Free cancel until {fmtDateNice(it.platformCutoffUtc || it?.cancellation?.platform?.cutoffUtc)}
//                       </span>
//                     ) : it?.cancellation?.platform?.refundable === false ? (
//                       <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
//                         Non-refundable
//                       </span>
//                     ) : null}
//                   </div>
//                 </div>

//                 <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>
//                   {fmtMoney(lineTotalNum)} {cur || displayCurrency}
//                 </div>

//                 <button
//                   onClick={() => removeItem(it.key)}
//                   style={removeBtn}
//                   title="Remove this room"
//                 >
//                   Remove
//                 </button>
//               </div>
//             );
//           })}
//         </div>
//       ) : (
//         <div style={{ color: "#777" }}>No rooms selected yet.</div>
//       )}

//       {Array.isArray(items) && items.length > 0 && (
//         <div style={{ fontSize: 12, color: "#6b7280" }}>
//           {nonRefundablePolicy
//             ? "⚠️ Contains non-refundable room(s). The whole booking will be treated as non-refundable."
//             : cutoffAggText
//             ? `Free cancellation until ${cutoffAggText}.`
//             : "Free cancellation policy depends on selected rooms."}
//         </div>
//       )}

//       <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
//         <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
//           <div>Subtotal (rooms only)</div>
//           <div>
//             {fmtMoney(total)} {displayCurrency}
//           </div>
//         </div>
//         <div style={{ fontSize: 12, color: "#6b7280" }}>
//           Taxes &amp; fees are calculated at the next step.
//         </div>
//         <button
//           disabled={!items?.length}
//           onClick={onCheckAvailability}
//           style={{
//             width: "100%",
//             padding: "12px 16px",
//             background: items?.length ? PRIMARY : "#ddd",
//             color: "#fff",
//             border: "none",
//             borderRadius: 10,
//             fontWeight: 700,
//             cursor: items?.length ? "pointer" : "not-allowed",
//           }}
//         >
//           Check availability
//         </button>
//       </div>
//     </div>
//   );
// }

// src/components/admin/hotel/SelectionSummary.jsx
"use client";

import React, { useMemo } from "react";
import { useSelectionStore } from "@/stores/selectionStore";
import { fmtMoney } from "@/utils/pricingDisplay";

/* date helpers (unchanged) */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MON_MAP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function deriveRoomNames(it) {
  // 1) Եթե Rooms array-ն արդեն ունի ≥2 item → անմիջապես օգտագործում ենք
  if (Array.isArray(it?.Rooms) && it.Rooms.length > 1) return it.Rooms;

  // 2) Հակառակ դեպքում վերցնում ենք base տեքստը՝
  //    կամ Rooms[0]-ը, կամ roomName-ը
  const base = Array.isArray(it?.Rooms) && it.Rooms.length === 1
    ? String(it.Rooms[0] || "")
    : String(it?.roomName || "");

  if (!base.trim()) return ["Room"];

  // 3) Մաքրում ենք HTML line-break ու nbsp
  const cleaned = base
    .replace(/<br\s*\/?>/gi, "|")  // <br> → |
    .replace(/&nbsp;/gi, " ")
    .trim();

  // 4) Պետք եղած split-ը՝ + / • / | / newline
  const parts = cleaned.split(/\s*(?:\+|•|\||\n)\s*/).filter(Boolean);

  // 5) Եթե իսկապես մի քանի անուն ստացվեց՝ վերադարձնում ենք, այլապես որպես մեկ item
  return parts.length > 1 ? parts : [cleaned];
}

function toUTC(y, m, d) {
  return new Date(Date.UTC(y, m, d));
}
function fmtUTC(d) {
  if (!d || isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${mon} ${year}`;
}
function parseDateFlexible(s) {
  if (!s) return null;
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  let m = String(s).match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (m) {
    const d = +m[1],
      mm = +m[2] - 1,
      y = +m[3];
    const dt = toUTC(y, mm, d);
    if (!isNaN(dt)) return dt;
  }
  m = String(s).match(/\b(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\b/);
  if (m) {
    const d = +m[1],
      mm = MON_MAP[m[2].toLowerCase()];
    const y = +m[3];
    if (mm >= 0) {
      const dt = toUTC(y, mm, d);
      if (!isNaN(dt)) return dt;
    }
  }
  m = String(s).match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) {
    const y = +m[1],
      mm = +m[2] - 1,
      d = +m[3];
    const dt = toUTC(y, mm, d);
    if (!isNaN(dt)) return dt;
  }
  return null;
}
function fmtDateNice(dateLike) {
  const d =
    typeof dateLike === "string" ? parseDateFlexible(dateLike) : dateLike;
  return fmtUTC(d);
}

const PRIMARY = "#f36323";

/* small utils for this component */
function pickItemCutoff(it) {
  return (
    it?.platformCutoffUtc ||
    it?.cancellation?.platform?.cutoffUtc ||
    it?.cancellation?.supplier?.deadlineUtc ||
    it?.cxlDeadline ||
    null
  );
}

export default function SelectionSummary({
  arrivalDate,
  checkOutDate,
  nights,
  adults,
  children,
  rooms,
  onCheckAvailability,
}) {
  const items = useSelectionStore((s) => s.items);
  const removeItem = useSelectionStore((s) => s.removeItem);

  const cutoffAggIso = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return null;
    const ts = items
      .map((it) => pickItemCutoff(it))
      .filter(Boolean)
      .map((x) => +new Date(x))
      .filter((n) => Number.isFinite(n));
    if (!ts.length) return null;
    return new Date(Math.min(...ts)).toISOString();
  }, [items]);

  const cutoffAggText = useMemo(
    () => fmtDateNice(cutoffAggIso),
    [cutoffAggIso]
  );

  const getLine = (it) => {
    const money = it?.priceRetail || it?.price || null;
    const amt = Number(money?.amount || 0);
    const cur = money?.currency || "USD";
    const qty = Number(it?.qty || 0);
    return { amt, cur, qty, total: amt * qty };
  };

  const displayCurrency = useMemo(() => {
    const first =
      items?.find((it) => it?.priceRetail?.currency)?.priceRetail?.currency ||
      items?.find((it) => it?.price?.currency)?.price?.currency ||
      "USD";
    return first;
  }, [items]);

  const total = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return 0;
    return items.reduce((sum, it) => sum + getLine(it).total, 0);
  }, [items]);

  const nonRefundablePolicy = useMemo(
    () =>
      Array.isArray(items) &&
      items.some(
        (x) =>
          x?.refundable === false ||
          x?.cancellation?.platform?.refundable === false
      ),
    [items]
  );

  /* styles */
  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "linear-gradient(0deg, #ffffff 0%, #fbfbff 100%)",
    boxShadow: "0 8px 24px rgba(17,24,39,0.08)",
    padding: 14,
    display: "grid",
    gap: 12,
    alignSelf: "start",
  };

  const itemCard = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    display: "grid",
    gap: 8,
  };

  const pill = (bg, bd, color) => ({
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    background: bg,
    border: `1px solid ${bd}`,
    color,
    whiteSpace: "nowrap",
  });

  const removeBtn = {
    fontSize: 12,
    color: "#ef4444",
    border: "1px solid #fecaca",
    background: "#fff",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  };

  const arriveNice = fmtDateNice(arrivalDate) || "—";
  const departNice = fmtDateNice(checkOutDate) || "—";

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ fontWeight: 900, fontSize: 18 }}>Your selection</div>

      <div style={{ color: "#374151", fontSize: 14 }}>
        <div style={{ fontWeight: 700 }}>
          {arriveNice} → {departNice} • {nights} night{nights > 1 ? "s" : ""}
        </div>
        <div
          style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          <span
            style={{
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 999,
              background: "#eef2ff",
              border: "1px solid #e5e7eb",
            }}
          >
            🌙 {nights} night{nights > 1 ? "s" : ""}
          </span>
          <span
            style={{
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 999,
              background: "#eef2ff",
              border: "1px solid #e5e7eb",
            }}
          >
            👤 {adults} adult{adults > 1 ? "s" : ""}
          </span>
          <span
            style={{
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 999,
              background: "#eef2ff",
              border: "1px solid #e5e7eb",
            }}
          >
            👶 {children} child{children !== 1 ? "ren" : ""}
          </span>
          <span
            style={{
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 999,
              background: "#eef2ff",
              border: "1px solid #e5e7eb",
            }}
          >
            🛏️ {rooms} room{rooms > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Middle block — redesigned: vertical cards with breakdown */}
      {Array.isArray(items) && items.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((it) => {
            const { amt, cur, qty, total: lineTotalNum } = getLine(it);
            const perNight =
              Number(nights) > 0 ? lineTotalNum / Number(nights) : lineTotalNum;

            // Room rows (prefer array, fallback split by + / • / |)
            // const roomNames =
            //   Array.isArray(it?.Rooms) && it.Rooms.length
            //     ? it.Rooms
            //     : (() => {
            //         const n = String(it?.roomName || "").trim();
            //         if (!n) return ["Room"];
            //         const parts = n.split(/\s*(?:\+|•|\|)\s*/).filter(Boolean);
            //         return parts.length ? parts : [n];
            //       })();
            const roomNames = deriveRoomNames(it);

            // Cancellation label
            const cancelIso = pickItemCutoff(it);
            const cancelLbl = fmtDateNice(cancelIso);

            return (
              <div key={it.key} style={itemCard}>
                {/* Rooms list */}
                {/* render list (unchanged structure) */}
                <div style={{ display: "grid", gap: 4 }}>
                  {roomNames.map((rn, idx) => (
                    <div
                      key={idx}
                      style={{ fontWeight: 800, color: "#111827" }}
                    >
                      Room {idx + 1}:{" "}
                      <span style={{ fontWeight: 600 }}>{String(rn)}</span>
                    </div>
                  ))}
                </div>

                {/* Meta rows */}
                <div
                  style={{
                    display: "grid",
                    gap: 4,
                    fontSize: 14,
                    color: "#374151",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700 }}>Meal plan:</span>{" "}
                    <span>{it?.board || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700 }}>
                      Free cancel until:
                    </span>{" "}
                    <span>
                      {cancelLbl ||
                        (it?.cancellation?.platform?.refundable === false
                          ? "Non-refundable"
                          : "—")}
                    </span>
                  </div>
                </div>

                {/* Badges (qty / refundable) */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {qty > 1 && (
                    <span style={pill("#fff7ed", "#fed7aa", "#9a3412")}>
                      × {qty}
                    </span>
                  )}
                  {it?.cancellation?.platform?.refundable === true ? (
                    <span style={pill("#ecfeff", "#a5f3fc", "#155e75")}>
                      Refundable
                    </span>
                  ) : it?.cancellation?.platform?.refundable === false ? (
                    <span style={pill("#fef2f2", "#fecaca", "#991b1b")}>
                      Non-refundable
                    </span>
                  ) : null}
                </div>

                {/* Price breakdown + remove */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Price breakdown
                    </div>
                    <div style={{ fontWeight: 800 }}>
                      {fmtMoney(perNight)} {cur || displayCurrency}{" "}
                      <span style={{ fontWeight: 400 }}>/ night</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Total: {fmtMoney(lineTotalNum)} {cur || displayCurrency}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(it.key)}
                    style={removeBtn}
                    title="Remove this room"
                    aria-label="Remove selection"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "#777" }}>No rooms selected yet.</div>
      )}

      {/* Bottom frame (unchanged) */}
      {Array.isArray(items) && items.length > 0 && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {nonRefundablePolicy
            ? "⚠️ Contains non-refundable room(s). The whole booking will be treated as non-refundable."
            : cutoffAggText
            ? `Free cancellation until ${cutoffAggText}.`
            : "Free cancellation policy depends on selected rooms."}
        </div>
      )}

      <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 900,
          }}
        >
          <div>Subtotal (rooms only)</div>
          <div>
            {fmtMoney(total)} {displayCurrency}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Taxes &amp; fees are calculated at the next step.
        </div>
        <button
          disabled={!items?.length}
          onClick={onCheckAvailability}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: items?.length ? PRIMARY : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            cursor: items?.length ? "pointer" : "not-allowed",
          }}
        >
          Check availability
        </button>
      </div>
    </div>
  );
}
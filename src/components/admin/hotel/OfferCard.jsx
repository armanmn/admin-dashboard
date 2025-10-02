"use client";
import React, { useMemo, useState } from "react";

/* ---------- helpers ---------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MON_MAP = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

function toUTC(y,m,d){ return new Date(Date.UTC(y,m,d)); }
function addDaysUTC(d, days){ const x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate()+days); return x; }
function fmtUTC(d){
  if(!d || isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2,"0");
  const mon = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${mon} ${year}`;
}
function parseDateFlexible(s){
  if(!s) return null;
  const iso = new Date(s);
  if(!isNaN(iso.getTime())) return iso;
  let m = String(s).match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if(m){ const d=+m[1], mm=+m[2]-1, y=+m[3]; const dt=toUTC(y,mm,d); if(!isNaN(dt)) return dt; }
  m = String(s).match(/\b(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\b/);
  if(m){ const d=+m[1], mm=MON_MAP[m[2].toLowerCase()]; const y=+m[3]; if(mm>=0){ const dt=toUTC(y,mm,d); if(!isNaN(dt)) return dt; } }
  m = String(s).match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if(m){ const y=+m[1], mm=+m[2]-1, d=+m[3]; const dt=toUTC(y,mm,d); if(!isNaN(dt)) return dt; }
  return null;
}
function fmtDateNice(dateLike){
  const d = typeof dateLike==="string" ? parseDateFlexible(dateLike) : dateLike;
  return fmtUTC(d);
}
function sanitizeBasicHtml(html){
  return String(html||"")
    .replace(/^<!\[CDATA\[|\]\]>$/g,"")
    .replace(/<\/?(script|style|iframe)[^>]*>/gi,"")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi,"")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi,"")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi,"")
    .replace(/<br\s*\/?>/gi,"<br/>");
}
function transformRemarksDates(html, bufferDays){
  if(!html) return html;
  const repl = (y,m,d) => {
    const dt = toUTC(+y, +m-1, +d);
    if(isNaN(dt)) return null;
    return fmtUTC(addDaysUTC(dt, -bufferDays));
  };
  let out = html;
  out = out.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (_a,d,m,y)=> repl(y,m,d) || _a);
  out = out.replace(/\b(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\b/g, (_a,d,mon,y)=> {
    const mm = MON_MAP[mon.toLowerCase()];
    const dt = toUTC(+y, mm, +d);
    return isNaN(dt) ? _a : fmtUTC(addDaysUTC(dt, -bufferDays));
  });
  out = out.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_a,y,m,d)=> repl(y,m,d) || _a);
  return out;
}
function money(amount, currency){
  if(amount==null || !currency) return "—";
  const n = Number(amount);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(amount);
  return `${formatted} ${currency}`;
}

/* ---------- Component ---------- */
export default function OfferCard({ offer, arrivalDate, selected = false, onToggle }) {
  if (!offer || typeof offer !== "object") return null;
  const [showDetails, setShowDetails] = useState(false);

  const rawRoomName = offer.roomName || "";
  const roomNames =
    Array.isArray(offer.roomNames) && offer.roomNames.length
      ? offer.roomNames
      : (rawRoomName.includes(" + ")
          ? rawRoomName.split(" + ").map(s => s.trim()).filter(Boolean)
          : (rawRoomName ? [rawRoomName] : []));
  const roomsCount = offer.roomsCount || (roomNames.length || null);

  const board = offer.board || "";

  const platformCutoffIso = offer?.cancellation?.platform?.cutoffUtc || null;
  const bufferDays = Number(offer?.cancellation?.platform?.bufferDays || 4) || 4;

  const isPlatformRefundable = offer?.cancellation?.platform?.refundable;
  const isRefLegacy = typeof offer?.refundable === "boolean" ? offer.refundable : undefined;
  const refundable =
    typeof isPlatformRefundable === "boolean" ? isPlatformRefundable :
    typeof isRefLegacy === "boolean" ? isRefLegacy : null;

  const cutoffText = useMemo(() => {
    if (!platformCutoffIso) return null;
    return fmtDateNice(platformCutoffIso);
  }, [platformCutoffIso]);

  const preferred = offer?.preferred === true;

  const retailAmount = offer?.retail?.amount ?? null;
  const retailCurrency = offer?.retail?.currency ?? offer?.price?.currency ?? null;
  const displayAmount = retailAmount ?? offer?.price?.amount ?? null;
  const displayCurrency = retailCurrency ?? offer?.price?.currency ?? null;

  const remarksSafeHtml = useMemo(() => {
    const clean = sanitizeBasicHtml(offer?.remarksHtml || "");
    return transformRemarksDates(clean, bufferDays);
  }, [offer?.remarksHtml, bufferDays]);

  const badges = [];
  if (refundable === true && cutoffText) badges.push(`Free cancel until ${cutoffText}`);
  if (refundable === false) badges.push("Non-refundable");
  if (preferred) badges.push("Preferred");
  if (/payable\s+at\s+hotel/i.test(String(remarksSafeHtml)) || /City\s*tax/i.test(String(remarksSafeHtml))) {
    badges.push("Local tax at hotel");
  }

  /* ---------- styles ---------- */
  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "linear-gradient(0deg, #ffffff 0%, #fbfbff 100%)",
    boxShadow: "0 8px 24px rgba(17,24,39,0.08)",
    padding: 14,
    display: "grid",
    gap: 10,
  };
  const mainRowStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  };
  const leftColStyle = { flex: "1 1 auto", minWidth: 0 };
  const rightColStyle = {
    flex: "0 0 auto",
    minWidth: 180,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  };
  const priceStyle = { fontWeight: 900, fontSize: 20, lineHeight: 1 };
  const priceSubStyle = { fontSize: 12, color: "#6b7280" };

  const btnBase = {
    padding: "9px 14px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  };
  const buttonPrimary = {
    ...btnBase,
    background: "var(--primary-color, #f36323)",
    color: "#fff",
    border: "none",
  };
  const buttonSelected = {
    ...btnBase,
    background: "#10b981",
    color: "#fff",
    border: "none",
  };
  const buttonGhost = {
    padding: "9px 12px",
    borderRadius: 10,
    background: "#f9fafb",
    color: "#111827",
    border: "1px solid #e5e7eb",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={cardStyle}>
      {/* main row */}
      <div style={mainRowStyle}>
        {/* LEFT */}
        <div style={leftColStyle}>
          {/* Multi-room lines */}
          {roomsCount > 1 ? (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                Rooms {roomsCount ? `(${roomsCount})` : ""}
                {board ? ` • ${board}` : ""}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {roomNames.map((rn, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span role="img" aria-label="bed">🛏️</span>
                    <strong>Room {idx + 1}.</strong>
                    <span style={{ fontWeight: 600 }}>{rn}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              {roomNames[0] || "Room"}{board ? ` • ${board}` : ""}
            </div>
          )}

          {!!badges.length && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {badges.map((b, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#eef2ff",
                    color: "#1f2937",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Left-side actions (details toggle) */}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setShowDetails((v) => !v)}
              style={buttonGhost}
            >
              {showDetails ? "Hide details" : "View details"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={rightColStyle}>
          <div style={priceStyle}>{money(displayAmount, displayCurrency)}</div>
          <div style={priceSubStyle}>Taxes &amp; fees not included</div>

          {typeof onToggle === "function" && (
            <button
              onClick={onToggle}
              style={selected ? buttonSelected : buttonPrimary}
            >
              {selected ? "✓ Selected" : "Select"}
            </button>
          )}
        </div>
      </div>

      {/* details block spans full width */}
      {showDetails && (
        <div
          style={{
            padding: 12,
            border: "1px dashed #e5e7eb",
            borderRadius: 10,
            background: "#fcfcfd",
            fontSize: 13,
            color: "#374151",
          }}
        >
          <div style={{ marginBottom: 8 }}>
            {refundable === true && cutoffText && (
              <div>
                <strong>Cancellation:</strong> Free until <u>{cutoffText}</u>.
              </div>
            )}
            {refundable === false && (
              <div>
                <strong>Cancellation:</strong> Non-refundable.
              </div>
            )}
          </div>

          {remarksSafeHtml ? (
            <div
              style={{ lineHeight: 1.45 }}
              dangerouslySetInnerHTML={{ __html: remarksSafeHtml }}
            />
          ) : (
            <div style={{ color: "#9ca3af" }}>No extra remarks</div>
          )}
        </div>
      )}
    </div>
  );
}
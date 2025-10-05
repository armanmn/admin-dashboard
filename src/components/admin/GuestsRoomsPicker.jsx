"use client";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import styles from "@/styles/hotelSearchBar.module.css";

/* ---------------- utils ---------------- */
const clamp = (n, min, max) => {
  const v = Number(n);
  return Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));
};
const rng = (n) => Array.from({ length: n }, (_, i) => i);

// keep age nullable in UI: null => "Age" placeholder
const clampAgeOrNull = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(17, Math.round(n)));
};

// canonicalize incoming value → internal rooms array
function parseInitialValue(value) {
  try {
    console.debug("[GRP] parseInitialValue IN:", value);
  } catch {}

  // accepted inputs:
  // 1) legacy aggregate: { adults, children, childrenAges, rooms }
  // 2) per-room csv:     { rooms, adultsCSV, childrenCSV, childrenAgesCSV }
  const rooms = clamp(Number(value?.rooms || 1), 1, 9);

  const adultsCSV =
    value?.adultsCSV ?? (value?.adults != null ? String(value.adults) : "2");

  const childrenCSV =
    value?.childrenCSV ??
    (value?.children != null ? String(value.children) : "0");

  const childrenAgesCSV =
    value?.childrenAgesCSV ??
    (Array.isArray(value?.childrenAges)
      ? String(value.childrenAges.join(",")) // single-room legacy → "5,7"
      : String(value?.childrenAges || ""));

  const A = String(adultsCSV || "")
    .split(",")
    .map((x) => clamp(x, 1, 6));

  const C = String(childrenCSV || "")
    .split(",")
    .map((x) => clamp(x, 0, 6));

  // supplier format: ROOMS by '|'  and ages-inside by ','
  const agesGroups = String(childrenAgesCSV || "")
    .split("|")
    .map((seg) =>
      String(seg || "")
        .split(",")
        .filter((s) => s !== "")
        .map((x) => clamp(x, 0, 17))
    );

  const hasAgesCsv = String(childrenAgesCSV || "").trim().length > 0;

  const list = [];
  for (let i = 0; i < rooms; i++) {
    const adults = A[i] ?? A[0] ?? 2;

    // “ages wins”: if agesCSV present → children = number of ages for that room
    const countFromAges = hasAgesCsv ? (agesGroups[i]?.length || 0) : null;
    const children = clamp(
      countFromAges != null ? countFromAges : (C[i] ?? C[0] ?? 0),
      0,
      6
    );

    // keep existing ages; ONLY pad missing with null (placeholder), trim overflow
    const baseAges = (agesGroups[i] || []).slice(0, children);
    while (baseAges.length < children) baseAges.push(null);

    list.push({ adults, children, ages: baseAges });
  }

  try {
    console.debug("[GRP] parseInitialValue OUT:", list);
  } catch {}

  return list;
}

function toPayloadFromRooms(roomsArr) {
  const rooms = clamp(roomsArr.length, 1, 9);
  const adultsCSV = roomsArr.map((r) => clamp(r.adults, 1, 6)).join(",");
  const childrenCSV = roomsArr.map((r) => clamp(r.children, 0, 6)).join(",");

  // build ages csv: rooms by '|'  and ages-inside by ','
  // IMPORTANT: include ONLY numeric ages; skip null placeholders
  const childrenAgesCSV = roomsArr
    .map((r) => {
      const c = clamp(r.children, 0, 6);
      const chunk = (r.ages || []).slice(0, c);
      const numeric = chunk
        .map((x) => clampAgeOrNull(x))
        .filter((v) => v !== null);
      return numeric.join(",");
    })
    .join("|");

  const totals = {
    adults: roomsArr.reduce((s, r) => s + clamp(r.adults, 1, 6), 0),
    children: roomsArr.reduce((s, r) => s + clamp(r.children, 0, 6), 0),
  };

  return { rooms, adultsCSV, childrenCSV, childrenAgesCSV, totals };
}

/* ---------------- pretty summary ---------------- */
function makeSummary(roomsArr) {
  const rooms = roomsArr.length;
  const totalA = roomsArr.reduce((s, r) => s + clamp(r.adults, 1, 6), 0);
  const totalC = roomsArr.reduce((s, r) => s + clamp(r.children, 0, 6), 0);
  const roomLabel = rooms === 1 ? "Room" : "Rooms";
  const childLabel = totalC === 1 ? "Child" : "Children";
  return totalC > 0
    ? `${totalA} Adults • ${totalC} ${childLabel} • ${rooms} ${roomLabel}`
    : `${totalA} Adults • ${rooms} ${roomLabel}`;
}

/* ---------------- component ---------------- */
const GuestsRoomsPicker = forwardRef(function GuestsRoomsPicker(
  {
    // accepted:
    // legacy: { adults, children, childrenAges, rooms }
    // csv:    { rooms, adultsCSV, childrenCSV, childrenAgesCSV }
    value = { rooms: 1, adults: 2, children: 0, childrenAges: [] },
    onChange, // (payload) => {}
    label = null,
    disabled = false,
  },
  ref
) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  // editable local model
  const [roomsArr, setRoomsArr] = useState(() => parseInitialValue(value));

  // sync from parent when value changes (canonical source of truth)
  useEffect(() => {
    setRoomsArr(parseInitialValue(value));
  }, [
    value?.rooms,
    value?.adults,
    value?.children,
    value?.childrenAges,
    value?.adultsCSV,
    value?.childrenCSV,
    value?.childrenAgesCSV,
  ]);

  // expose current payload for parent (used by HotelSearchBar to commit state)
  useImperativeHandle(
    ref,
    () => ({
      getCurrentPayload: () => toPayloadFromRooms(roomsArr),
    }),
    [roomsArr]
  );

  // outside click closes
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const summary = useMemo(() => makeSummary(roomsArr), [roomsArr]);

  const addRoom = () => {
    if (roomsArr.length >= 9) return;
    setRoomsArr((prev) => [...prev, { adults: 2, children: 0, ages: [] }]);
  };

  const removeRoom = (idx) => {
    if (roomsArr.length <= 1) return;
    setRoomsArr((prev) => prev.filter((_, i) => i !== idx));
  };

  const setRoom = (idx, patch) => {
    setRoomsArr((prev) => {
      const next = prev.slice();
      const merged = { ...next[idx], ...patch };
      const c = clamp(merged.children, 0, 6);

      // keep existing ages; fill blanks with null; trim overflow
      const curAges = Array.isArray(merged.ages) ? merged.ages.slice() : [];
      const ages = curAges.slice(0, c);
      while (ages.length < c) {
        const k = ages.length;
        const v = curAges[k];
        ages.push(clampAgeOrNull(v)); // will push number or null
      }

      next[idx] = { ...merged, children: c, ages };
      return next;
    });
  };

  const apply = () => {
    const payload = toPayloadFromRooms(roomsArr);
    try {
      console.groupCollapsed("[GRP] APPLY → payload");
      console.table(payload);
      console.groupEnd();
    } catch {}
    onChange?.(payload);
    setOpen(false);
  };

  const resetToDefault = () =>
    setRoomsArr([{ adults: 2, children: 0, ages: [] }]);

  return (
    <div className={styles.inputGroup} ref={anchorRef}>
      {/* Trigger */}
      <div
        className={styles.guestSelector}
        onClick={() => !disabled && setOpen((v) => !v)}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Guests & rooms"
        style={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {label ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
        ) : null}
        <div style={{ fontWeight: 800 }}>{summary}</div>

        {open && (
          <div
            className={styles.guestOptions}
            role="dialog"
            aria-label="Guests and rooms"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rooms list */}
            <div style={{ display: "grid", gap: 10 }}>
              {roomsArr.map((r, idx) => (
                <div
                  key={`room-${idx}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Room {idx + 1}</div>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => removeRoom(idx)}
                      disabled={roomsArr.length <= 1}
                      style={{ padding: "6px 10px" }}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Adults / Children counters */}
                  <div className={styles.optionRow}>
                    <span className={styles.optionLabel}>👤 Adults</span>
                    <div className={styles.counter}>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() =>
                          setRoom(idx, { adults: clamp(r.adults - 1, 1, 6) })
                        }
                      >
                        −
                      </button>
                      <span className={styles.counterValue}>{r.adults}</span>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() =>
                          setRoom(idx, { adults: clamp(r.adults + 1, 1, 6) })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.optionRow}>
                    <span className={styles.optionLabel}>🧒 Children</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      (ages 0–17)
                    </span>
                    <div className={styles.counter}>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() =>
                          setRoom(idx, {
                            children: clamp(r.children - 1, 0, 6),
                          })
                        }
                      >
                        −
                      </button>
                      <span className={styles.counterValue}>{r.children}</span>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() =>
                          setRoom(idx, {
                            children: clamp(r.children + 1, 0, 6),
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children ages per room */}
                  {r.children > 0 && (
                    <div className={styles.agesBlock}>
                      <div className={styles.agesTitle}>Children ages</div>
                      <div className={styles.ageGrid}>
                        {r.ages.map((age, j) => (
                          <label
                            className={styles.ageItem}
                            key={`room-${idx}-child-${j}`}
                          >
                            <span>Child {j + 1}</span>
                            <select
                              className={styles.ageSelect}
                              value={age ?? ""} // null → ""
                              onChange={(e) => {
                                const raw = e.target.value;
                                const a =
                                  raw === "" ? null : clampAgeOrNull(raw);
                                setRoomsArr((prev) => {
                                  const copy = prev.slice();
                                  const ages = copy[idx].ages.slice();
                                  ages[j] = a;
                                  copy[idx] = { ...copy[idx], ages };
                                  return copy;
                                });
                              }}
                            >
                              <option value="">Age</option>
                              {rng(18).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={addRoom}
                  disabled={roomsArr.length >= 9}
                  style={{ borderStyle: "dashed" }}
                >
                  + Add room
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={resetToDefault}
              >
                Reset
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={apply}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default GuestsRoomsPicker;
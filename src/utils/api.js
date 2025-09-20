const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api/v1";

function isAbsolute(u) {
  return /^https?:\/\//i.test(u);
}
function buildURL(input) {
  if (isAbsolute(input)) return input;
  const path = input.startsWith("/") ? input : `/${input}`;
  return `${API_BASE}${path}`;
}

// --- helpers for offerProof -> hotelSearchCode ---
function b64urlToUtf8(b64url) {
  try {
    let s = String(b64url || "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4;
    if (pad) s += "=".repeat(4 - pad);
    if (typeof window === "undefined") {
      return Buffer.from(s, "base64").toString("utf8");
    }
    // browser
    return atob(s);
  } catch {
    return "";
  }
}
function extractHotelSearchCodeFromOfferProof(offerProof) {
  try {
    const parts = String(offerProof || "").split(".");
    if (parts.length < 2) return null;
    const payloadJSON = b64urlToUtf8(parts[1]);
    if (!payloadJSON) return null;
    const payload = JSON.parse(payloadJSON);
    return (
      payload?.hotelSearchCode ||
      payload?.searchCode ||
      payload?.search_code ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Rewrites valuation URLs:
 *  - if /suppliers/goglobal/valuation?offerProof=... -> replace with hotelSearchCode=...
 *  - if already has hotelSearchCode/searchCode -> leaves as is
 */
function rewriteValuationURLIfNeeded(absUrl) {
  try {
    const u = new URL(absUrl);
    if (!u.pathname.includes("/suppliers/goglobal/valuation")) return absUrl;

    const currentHotelCode = u.searchParams.get("hotelSearchCode") || u.searchParams.get("searchCode");
    const offerProof = u.searchParams.get("offerProof");

    if (!currentHotelCode && offerProof) {
      const code = extractHotelSearchCodeFromOfferProof(offerProof);
      u.searchParams.delete("offerProof");
      if (code) u.searchParams.set("hotelSearchCode", code);
      return u.toString();
    }
    return absUrl;
  } catch {
    return absUrl;
  }
}

async function doFetch(url, init) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    // թողնենք ավելի խոսուն error
    const text = await res.text().catch(() => "");
    const err = new Error(`API request failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

const api = {
  get: async (input, init) => {
    let url = buildURL(input);
    // ⛑️ valuation rewrite (offerProof -> hotelSearchCode)
    url = rewriteValuationURLIfNeeded(url);
    console.log("🌐 Final fetch URL:", url);
    return doFetch(url, { method: "GET", ...init });
  },
  post: async (input, body, init) => {
    let url = buildURL(input);
    url = rewriteValuationURLIfNeeded(url);
    console.log("🌐 Final fetch URL:", url);
    return doFetch(url, { method: "POST", body: JSON.stringify(body), ...init });
  },
};

export default api;
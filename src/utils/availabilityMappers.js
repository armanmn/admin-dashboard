// src/utils/availabilityMappers.js
// FE-only, no backend changes. Minimal-risk utilities.
// Note: if you already use DOMPurify or isomorphic-dompurify, import it below.
// import DOMPurify from 'isomorphic-dompurify';

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

function stripCdata(html = "") {
  return html.replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "");
}

// Very defensive date parser: tries ISO first, then DD/MM/YYYY, then DD/Mon/YYYY.
// We assume DD/MM/YYYY (European) when ambiguous. Adjust if your provider uses MM/DD.
export function parseDateGuess(str) {
  if (!str) return null;
  const s = String(str).trim();

  // ISO (2025-11-04 or 2025-11-04T00:00:00Z)
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;

  // DD/MM/YYYY or D/M/YYYY with / or -
  let m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1; // assume DD/MM/YYYY
    const y = parseInt(m[3], 10);
    const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0));
    if (!isNaN(dt.getTime())) return dt;
  }

  // DD/Mon/YYYY (e.g., 08/Nov/2025)
  m = s.match(/\b(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{4})\b/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mon = MONTHS[m[2].toLowerCase()];
    const y = parseInt(m[3], 10);
    if (mon != null) {
      const dt = new Date(Date.UTC(y, mon, d, 0, 0, 0));
      if (!isNaN(dt.getTime())) return dt;
    }
  }

  return null;
}

export function addDaysUTC(date, days) {
  const dt = new Date(date.getTime());
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

export function formatIsoLocal(isoLike, {
  locale = 'en-GB',
  timeZone = 'Asia/Yerevan',
  withTime = false
} = {}) {
  if (!isoLike) return '';
  const d = typeof isoLike === 'string' ? new Date(isoLike) : isoLike;
  if (isNaN(d.getTime())) return '';

  const base = {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  };
  const opts = withTime ? { ...base, hour: '2-digit', minute: '2-digit' } : base;
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

// Replace only cancellation-related dates in a small safe set of nodes.
// Strategy:
//  - Find lines containing CXL|CANCEL|PENALTY (case-insensitive).
//  - Extract date tokens and compute adjusted date:
//      preferred = platformCutoffUtc (if provided)
//      fallback  = supplierDate - bufferDays
//  - Replace the token text with formatted adjusted date.
//  - Keep the rest of the text as-is (sanitize upstream).
export function adjustCancellationDatesInHtml(html, {
  bufferDays = 0,
  platformCutoffUtc = null,
  locale = 'en-GB',
  timeZone = 'Asia/Yerevan'
} = {}) {
  if (!html) return '';

  // 1) Strip CDATA if present
  let raw = stripCdata(html);

  // 2) Identify candidate lines by keywords to avoid touching check-in times, etc.
  const KEYWORD_RE = /(CXL|CANCEL|CANCELLATION|PENALTY|FREE\s+CANCELLATION)/i;

  // 3) Date token regexes (keep them simple & robust)
  const DATE_TOKENS_RE = /\b(\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|(?:\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?)\b/g;

  // 4) Replace function per line/paragraph
  const replacer = (segment) => {
    if (!KEYWORD_RE.test(segment)) return segment; // ignore non-cancellation lines

    return segment.replace(DATE_TOKENS_RE, (token) => {
      const parsed = parseDateGuess(token);
      if (!parsed) return token;

      // Derive adjusted date
      let adjusted = platformCutoffUtc ? new Date(platformCutoffUtc) : addDaysUTC(parsed, -bufferDays);
      if (isNaN(adjusted.getTime())) return token;

      const formatted = formatIsoLocal(adjusted, { locale, timeZone, withTime: false });
      return formatted;
    });
  };

  // 5) Apply line-wise on HTML text nodes (keep it simple: operate on the text content)
  // We avoid heavy DOM since frameworks differ SSR/CSR. If you already use DOMPurify and DOM APIs, you can swap to a more granular approach.
  // Light-touch: split by tags and replace in text chunks only.
  raw = raw.replace(/>([^<]+)</g, (_, text) => {
    const changed = replacer(text);
    return '>' + changed + '<';
  });

  // 6) OPTIONAL sanitize (uncomment if DOMPurify is available)
  // return DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['p','ul','ol','li','b','strong','em','u','br','span'], ALLOWED_ATTR: [] });

  return raw;
}

// --- Mapping helpers for UI ---

export function buildCancellationLine(valuation, {
  locale = 'en-GB',
  timeZone = 'Asia/Yerevan'
} = {}) {
  const cutoff = valuation?.cancellation?.platform?.cutoffUtc || valuation?.platformCutoffUtc;
  const freeUntil = cutoff ? formatIsoLocal(cutoff, { locale, timeZone }) : null;
  return freeUntil ? `Free cancellation until ${freeUntil}` : null;
}

export function mapHotelToCardDTO(hotel, {
  nights = 1,
  locale = 'en-GB',
  timeZone = 'Asia/Yerevan'
} = {}) {
  const min = hotel?.minPrice?.amount ?? hotel?.minOffer?.price?.amount ?? null;
  const currency = hotel?.minPrice?.currency ?? hotel?.minOffer?.price?.currency ?? null;
  const roomTeaser = hotel?.minOffer?.roomName || hotel?.offersPreview?.[0]?.roomName || null;
  const cutoff = hotel?.minOffer?.platformCutoffUtc || hotel?.minOffer?.cancellation?.platform?.cutoffUtc || null;

  return {
    id: String(hotel?._id ?? hotel?.externalSource?.hotelCode ?? ''),
    name: hotel?.name ?? '',
    stars: hotel?.stars ?? hotel?.category ?? null,
    thumbnail: hotel?.thumbnail ?? hotel?.pictures?.find(p => p.isMain)?.url ?? null,
    location: { city: hotel?.location?.city, country: hotel?.location?.country },
    priceFrom: min != null && currency ? { amount: min, currency } : null,
    priceLabel: (min != null && currency) ? `From ${min} ${currency} / ${nights} night${nights>1?'s':''}` : null,
    board: hotel?.minOffer?.board ?? hotel?.offersPreview?.[0]?.board ?? null,
    refundable: hotel?.minOffer?.refundable ?? hotel?.offersPreview?.[0]?.refundable ?? null,
    refundableUntilLabel: cutoff ? `Free cancellation until ${formatIsoLocal(cutoff, { locale, timeZone })}` : null,
    roomTeaser
  };
}

export function buildRemarksHtmlForDisplay(valuation, {
  locale = 'en-GB',
  timeZone = 'Asia/Yerevan'
} = {}) {
  const bufferDays = valuation?.cancellation?.platform?.bufferDays ?? valuation?.bufferDays ?? 0;
  const platformCutoffUtc = valuation?.cancellation?.platform?.cutoffUtc ?? valuation?.platformCutoffUtc ?? null;

  // Prefer annotated if present, else remarks
  const html = valuation?.remarksAnnotatedHtml || valuation?.remarks || '';
  if (!html) return '';

  return adjustCancellationDatesInHtml(html, { bufferDays, platformCutoffUtc, locale, timeZone });
}
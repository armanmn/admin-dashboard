// src/utils/remarks.js
export function normalizeRemarks(html = "", maxLines = 3) {
  const txt = String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  const lines = txt.split("\n").map(s => s.trim()).filter(Boolean);
  const head = lines.slice(0, maxLines);
  const rest = lines.slice(maxLines);
  return { head, rest, hasMore: rest.length > 0 };
}
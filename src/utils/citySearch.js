// // src/utils/citySearch.js
// // 🔹 Սինք տարբերակ՝ առանց fetch-ի, JSON-ը ներմուծում ենք build-time
// import goglCities from "@/data/gogl_cities.json";

// const CITIES = Array.isArray(goglCities) ? goglCities : [];

// const normalize = (str) =>
//   String(str || "")
//     .trim()
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "");

// // 🔸 Քաղաքից → կոդ (սինք)
// export function resolveCityCode(input) {
//   if (!input) return null;

//   const s = String(input).trim();
//   // եթե արդեն թվային ID է
//   if (/^\d+$/.test(s)) return s;

//   const n = normalize(s);

//   // 1) ճշգրիտ համընկնում
//   const exact = CITIES.find((c) => normalize(c.CityName) === n);
//   if (exact) return String(exact.CityId);

//   // 2) մասամբ համընկնում
//   const partial = CITIES.find((c) => normalize(c.CityName).includes(n));
//   if (partial) return String(partial.CityId);

//   return null;
// }

// // 🔸 Կոդից → անուն (օգտակար, եթե պետք գա)
// export function resolveCityName(code) {
//   if (!code) return null;
//   const s = String(code).trim();
//   const hit = CITIES.find((c) => String(c.CityId) === s);
//   return hit ? hit.CityName : null;
// }

// // 🔸 Ավելի general որոնում (autosuggest-ի համար)
// export function searchCities(query, limit = 10) {
//   const n = normalize(query);
//   if (!n) return [];
//   return CITIES.filter((c) => normalize(c.CityName).includes(n)).slice(0, limit);
// }

// src/utils/citySearch.js
// FE only calls backend; no local JSON duplication.
//
// Endpoints expected:
//  - GET /api/v1/cities/suggest?q=Paris&supplier=goglobal
//     -> { items: [{ cityId, name, country }, ...] }
//  - GET /api/v1/cities/resolve?name=Paris&supplier=goglobal
//     -> { cityId, name, country }  OR  404/empty if not found

// src/utils/citySearch.js
const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")) ||
  "http://localhost:5000";

async function httpGet(path) {
  const url = `${API_BASE}${path}`;
  // console.debug("citySearch GET:", url);
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} -> ${res.status} ${text}`);
  }
  return res.json();
}

// Ավիաուղղությունը՝ suggestion list
export async function suggestCities(query, supplier) {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams();
  params.set("query", query.trim());
  if (supplier) params.set("supplier", supplier); // սերվերի կողմում safe է, անտեսվելու դեպքում չի խանգարի

  const data = await httpGet(`/api/v1/meta/cities?${params.toString()}`);

  // Նորմալացնենք դաշտերը, որ frontend-ը միշտ ստանա նույն կառուցվածքը
  return (Array.isArray(data) ? data : []).map((c) => ({
    code: c.code ?? c.cityCode ?? c._id,
    name: c.name ?? c.CityName,
    country: c.country ?? c.countryName,
    supplierCityId:
      c.supplierCityId ??
      (supplier && c.mappings && c.mappings[supplier] ? c.mappings[supplier] : undefined),
  })).filter(x => x.name && (x.code || x.supplierCityId));
}

// Անունից → supplier code / մեր code
export async function resolveCityCode(name, supplier) {
  if (!name) return null;
  const params = new URLSearchParams();
  params.set("name", name.trim());
  if (supplier) params.set("supplier", supplier);

  try {
    const c = await httpGet(`/api/v1/meta/cities/resolve?${params.toString()}`);
    return String(
      c?.supplierCityId ??
      c?.code ??
      c?.cityCode ??
      ""
    ) || null;
  } catch {
    return null;
  }
}

export function formatCityLabel(c) {
  const parts = [c?.name, c?.country].filter(Boolean);
  return parts.join(", ");
}
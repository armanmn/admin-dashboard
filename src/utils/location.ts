// src/utils/location.ts
export function formatLocationLine(city: string, country: string, area?: string, rooms?: number) {
  const bits = [
    [city, country].filter(Boolean).join(", "),
    area?.trim(),
    rooms ? `${rooms} rooms` : null,
  ].filter(Boolean);
  return bits.join(" • ");
}
// Card-ում
// formatLocationLine("Dubai", "United Arab Emirates", "DUBAI LAND", 2)
// → "Dubai, United Arab Emirates • DUBAI LAND • 2 rooms"
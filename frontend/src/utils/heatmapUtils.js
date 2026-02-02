// Normalize intensity (1–5) to a 0–1 weight for Leaflet.heat
export const toHeatmapPoints = (reports) =>
  reports.map(r => [r.lat, r.lng, r.intensity / 5]);

// utils/neighbourhoods.js
export const NEIGHBOURHOODS = [
  { name: 'The Forks / Exchange District', lat: 49.9, lng: -97.135 },
  { name: 'South Broadway', lat: 49.87, lng: -97.13 },
  { name: 'Osborne Village', lat: 49.885, lng: -97.135 },
  { name: 'River Heights', lat: 49.88, lng: -97.155 },
  { name: 'Wolseley', lat: 49.895, lng: -97.12 },
  { name: 'North End', lat: 49.93, lng: -97.12 },
  { name: 'West End', lat: 49.9, lng: -97.17 },
  { name: 'St. Boniface', lat: 49.895, lng: -97.08 },
  { name: 'Fort Rouge', lat: 49.87, lng: -97.1 },
  { name: 'Tuxedo', lat: 49.9, lng: -97.2 },
  { name: 'Charleswood', lat: 49.9, lng: -97.24 },
  { name: 'St. James-Assiniboia', lat: 49.9, lng: -97.22 },
  { name: 'Grandview', lat: 49.91, lng: -97.14 },
  { name: 'Elmwood', lat: 49.92, lng: -97.08 },
  { name: 'Transcona', lat: 49.91, lng: -97.0 },
  { name: 'St. Vital', lat: 49.84, lng: -97.1 },
  { name: 'Fort Garry', lat: 49.83, lng: -97.12 },
  { name: 'Kildonan', lat: 49.95, lng: -97.08 },
  { name: 'West Kildonan', lat: 49.95, lng: -97.17 },
];

// Returns the nearest neighbourhood to a given lat/lng.
// Uses squared Euclidean distance — no need for actual geodesic math,
// we just need "which centre is closest" and at Winnipeg's latitude
// the error from ignoring the lng scaling is small enough not to matter.
export function getNearestNeighbourhood(lat, lng) {
  let nearest = null;
  let nearestDist = Infinity;

  for (const n of NEIGHBOURHOODS) {
    const dlat = lat - n.lat;
    const dlng = lng - n.lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = n;
    }
  }

  return nearest;
}

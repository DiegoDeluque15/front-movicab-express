export const environment = {
  production: true,
  appName: 'MoviCab Express',
  apiUrl: 'http://localhost:4000/api',
  wsUrl: 'ws://localhost:4000/ws/tracking',
  requireAuth: true,
  primeUiLicense: 'eyJpZCI6IjE2YWZkNzdiLTE1OGItNDJkOS04NzZiLTAwZGY4NDY5OWVhOSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTMxMTgwMDAsImV4cCI6MTgyNDY1NDAwMH0.N85iHs25k_Ct0Sd2JWrrEp9WqbLcocPlbqf-OBqZnNYz6ead67zHA6a6U0tvZbaIo766NGEEg_p_6IzfhvpVDw',
  map: {
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
    defaultCenter: { lat: 4.6534, lng: -74.0836 },
    defaultZoom: 13,
    osrmApiUrl: 'https://router.project-osrm.org/route/v1/driving',
    nominatimApiUrl: 'https://nominatim.openstreetmap.org',
  },
};

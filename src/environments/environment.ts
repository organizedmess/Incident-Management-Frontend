// Production defaults. Requests are made to relative paths so this works out of the box
// behind a reverse proxy that forwards /incidents, /analytics and /api to the backend.
// Set to a full origin (e.g. https://api.example.com) if the backend is not proxied.
export const environment = {
  production: true,
  apiBaseUrl: '',
  pollingIntervalMs: 15000,
};

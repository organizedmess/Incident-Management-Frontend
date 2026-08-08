// The backend's route paths (/incidents, /analytics, /api/incidents) collide with this
// app's own frontend routes (/incidents, /incidents/:id, /analytics). A plain path-based
// proxy would swallow direct navigation/refreshes on those routes and return raw JSON
// instead of index.html. `bypass` lets browser navigations (Accept: text/html) fall
// through to the Angular dev-server's SPA handling, while XHR/fetch calls made by
// HttpClient (which don't send that Accept header) still get proxied to the backend.
const BACKEND = 'https://incident-management-system-uk2o.onrender.com';

function bypassNavigationRequests(req) {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return '/index.html';
  }
}

module.exports = {
  '/incidents': { target: BACKEND, secure: false, bypass: bypassNavigationRequests },
  '/analytics': { target: BACKEND, secure: false, bypass: bypassNavigationRequests },
  '/api': { target: BACKEND, secure: false, bypass: bypassNavigationRequests },
};

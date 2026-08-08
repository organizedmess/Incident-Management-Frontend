// Dev requests hit relative paths too; proxy.conf.json forwards them to the Spring Boot
// backend at localhost:8080, which avoids CORS entirely (the backend has no CORS config).
export const environment = {
  production: false,
  apiBaseUrl: '',
  pollingIntervalMs: 15000,
};

import { AnalyticsOverviewResponse, DailyCountResponse, SeverityCountResponse, StatusCountResponse } from '../models/analytics.model';
import { IncidentResponse, RecentIncidentResponse } from '../models/incident.model';

// Static, deterministic demo data shown while the backend is waking up (Render free-tier
// cold start) or temporarily unreachable. Never regenerated per-render and never used for
// write operations — see BackendStatusService for how this is surfaced to the UI.

// Timestamps are computed relative to page-load time (not a fixed calendar date) so
// "reported 2 hours ago" never drifts into a future-looking "in 2 hours" once real time
// moves past a hardcoded anchor. The *offsets* themselves (which incident, how long ago,
// relative ordering) are what's static/deterministic — only the reference point is "now".
const DAY_MS = 86_400_000;
const NOW = Date.now();
const daysAgo = (days: number, hours = 0, minutes = 0): string =>
  new Date(NOW - days * DAY_MS - hours * 3_600_000 - minutes * 60_000).toISOString();

export const DEMO_INCIDENTS: IncidentResponse[] = [
  {
    id: 9001,
    title: 'Primary database connection lost for payments-api',
    description:
      'payments-api is reporting connection timeouts to the primary Postgres cluster in us-east-1. Connection pool exhausted, all write operations are failing.',
    severity: 'CRITICAL',
    status: 'ACKNOWLEDGED',
    source: 'monitoring',
    createdAt: daysAgo(0, 1, 45),
    updatedAt: daysAgo(0, 1, 10),
  },
  {
    id: 9002,
    title: 'CrashLoopBackOff on checkout-service deployment',
    description:
      'Pods for the checkout-service deployment in eu-west-1 are stuck in CrashLoopBackOff after the latest rollout. Readiness probes are failing on startup.',
    severity: 'CRITICAL',
    status: 'OPEN',
    source: 'kubernetes',
    createdAt: daysAgo(0, 4, 20),
    updatedAt: daysAgo(0, 4, 20),
  },
  {
    id: 9003,
    title: 'Sustained CPU spike on user-auth',
    description:
      'user-auth instances in us-west-2 have been running at 96% CPU utilization for over 5 minutes. Autoscaling has reached its configured limit.',
    severity: 'HIGH',
    status: 'ACKNOWLEDGED',
    source: 'monitoring',
    createdAt: daysAgo(0, 7, 5),
    updatedAt: daysAgo(0, 6, 30),
  },
  {
    id: 9004,
    title: 'Suspected memory leak in notification-worker',
    description:
      'Heap usage on notification-worker has grown steadily over the last 6 hours without returning to baseline after GC cycles. Pods are approaching their memory limit and restarting.',
    severity: 'HIGH',
    status: 'OPEN',
    source: 'monitoring',
    createdAt: daysAgo(1, 2, 0),
    updatedAt: daysAgo(1, 2, 0),
  },
  {
    id: 9005,
    title: 'Elevated timeouts between orders-api and inventory-service',
    description:
      'orders-api is seeing intermittent request timeouts (~18% error rate) when calling inventory-service. Latency p99 has exceeded 5s in ap-south-1.',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    source: 'monitoring',
    createdAt: daysAgo(1, 9, 15),
    updatedAt: daysAgo(1, 3, 0),
  },
  {
    id: 9006,
    title: 'Disk usage critical on search-indexer host',
    description:
      'Root volume for search-indexer in us-east-1 is at 94% capacity. Log rotation is failing and write operations may soon be rejected.',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    source: 'monitoring',
    createdAt: daysAgo(2, 5, 40),
    updatedAt: daysAgo(1, 20, 0),
  },
  {
    id: 9007,
    title: 'Billing webhook retries exhausted for billing-service',
    description:
      'billing-service exhausted retry attempts delivering webhooks to the downstream reconciliation service. 42 events are queued for manual replay.',
    severity: 'HIGH',
    status: 'RESOLVED',
    source: 'billing-service',
    createdAt: daysAgo(2, 14, 0),
    updatedAt: daysAgo(2, 6, 0),
  },
  {
    id: 9008,
    title: 'Search index lag on search-indexer',
    description:
      'search-indexer consumer group is lagging by over 50k messages behind the incident-logs topic, causing stale search results.',
    severity: 'LOW',
    status: 'RESOLVED',
    source: 'kafka',
    createdAt: daysAgo(3, 1, 0),
    updatedAt: daysAgo(2, 22, 0),
  },
  {
    id: 9009,
    title: 'TLS certificate nearing expiry for api-gateway',
    description:
      'The TLS certificate for api-gateway.internal expires in 5 days. Auto-renewal has not yet triggered.',
    severity: 'LOW',
    status: 'ACKNOWLEDGED',
    source: 'monitoring',
    createdAt: daysAgo(3, 11, 0),
    updatedAt: daysAgo(3, 8, 0),
  },
  {
    id: 9010,
    title: 'Elevated 5xx rate on inventory-service',
    description:
      'inventory-service is returning a 6% 5xx error rate following the last deployment in us-east-1. Rollback is being evaluated.',
    severity: 'HIGH',
    status: 'RESOLVED',
    source: 'monitoring',
    createdAt: daysAgo(4, 3, 0),
    updatedAt: daysAgo(3, 23, 0),
  },
  {
    id: 9011,
    title: 'Network timeout between checkout-service and payments-api',
    description:
      'checkout-service is seeing intermittent request timeouts (~11% error rate) when calling payments-api. Latency p99 has exceeded 4s in us-east-1.',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    source: 'monitoring',
    createdAt: daysAgo(5, 6, 0),
    updatedAt: daysAgo(5, 1, 0),
  },
  {
    id: 9012,
    title: 'Scheduled maintenance window completed for orders-api',
    description:
      'Planned database index rebuild for orders-api completed successfully with no downtime.',
    severity: 'LOW',
    status: 'RESOLVED',
    source: 'monitoring',
    createdAt: daysAgo(6, 8, 0),
    updatedAt: daysAgo(6, 5, 0),
  },
];

export const DEMO_OVERVIEW: AnalyticsOverviewResponse = {
  totalIncidents: 128,
  openIncidents: 9,
  resolvedIncidents: 104,
  criticalIncidents: 6,
  averagePriorityScore: 54.2,
};

export const DEMO_SEVERITY_BREAKDOWN: SeverityCountResponse[] = [
  { severity: 'CRITICAL', count: 6 },
  { severity: 'HIGH', count: 22 },
  { severity: 'MEDIUM', count: 47 },
  { severity: 'LOW', count: 53 },
];

export const DEMO_STATUS_BREAKDOWN: StatusCountResponse[] = [
  { status: 'OPEN', count: 9 },
  { status: 'ACKNOWLEDGED', count: 15 },
  { status: 'RESOLVED', count: 104 },
];

// 14-day trend, oldest first — deterministic values with a mild weekday pattern.
export const DEMO_TRENDS: DailyCountResponse[] = [
  9, 7, 11, 6, 8, 4, 3, 10, 12, 8, 9, 6, 5, 7,
].map((count, i) => ({ day: daysAgo(13 - i).slice(0, 10), count }));

export const DEMO_RECENT_INCIDENTS: RecentIncidentResponse[] = DEMO_INCIDENTS.slice(0, 6).map((i) => ({
  id: i.id,
  title: i.title,
  severity: i.severity,
  status: i.status,
  createdAt: i.createdAt,
}));

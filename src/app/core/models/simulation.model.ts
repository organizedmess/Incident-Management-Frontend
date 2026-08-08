import { IncidentCreateRequest, Severity } from './incident.model';

export interface SimulationScenario {
  id: string;
  label: string;
  icon: string;
  severity: Severity;
  build: () => IncidentCreateRequest;
}

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const pct = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));

const SERVICES = [
  'checkout-service',
  'payments-api',
  'user-auth',
  'inventory-service',
  'notification-worker',
  'search-indexer',
  'orders-api',
  'billing-service',
] as const;

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'] as const;

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'database-failure',
    label: 'Database failure',
    icon: 'database',
    severity: 'CRITICAL',
    build: () => {
      const service = pick(SERVICES);
      return {
        title: `Primary database connection lost for ${service}`,
        description: `${service} is reporting connection timeouts to the primary Postgres cluster in ${pick(REGIONS)}. Connection pool exhausted, all write operations are failing.`,
        severity: 'CRITICAL',
        source: 'monitoring',
      };
    },
  },
  {
    id: 'cpu-spike',
    label: 'CPU spike',
    icon: 'cpu',
    severity: 'HIGH',
    build: () => {
      const service = pick(SERVICES);
      const usage = pct(88, 99);
      return {
        title: `Sustained CPU spike on ${service}`,
        description: `${service} instances in ${pick(REGIONS)} have been running at ${usage}% CPU utilization for over 5 minutes. Autoscaling has reached its configured limit.`,
        severity: 'HIGH',
        source: 'monitoring',
      };
    },
  },
  {
    id: 'memory-leak',
    label: 'Memory leak',
    icon: 'memory-stick',
    severity: 'HIGH',
    build: () => {
      const service = pick(SERVICES);
      return {
        title: `Suspected memory leak in ${service}`,
        description: `Heap usage on ${service} has grown steadily over the last 6 hours without returning to baseline after GC cycles. Pods are approaching their memory limit and restarting.`,
        severity: 'HIGH',
        source: 'monitoring',
      };
    },
  },
  {
    id: 'disk-full',
    label: 'Disk full',
    icon: 'hard-drive',
    severity: 'MEDIUM',
    build: () => {
      const service = pick(SERVICES);
      const usage = pct(92, 99);
      return {
        title: `Disk usage critical on ${service} host`,
        description: `Root volume for ${service} in ${pick(REGIONS)} is at ${usage}% capacity. Log rotation is failing and write operations may soon be rejected.`,
        severity: 'MEDIUM',
        source: 'monitoring',
      };
    },
  },
  {
    id: 'network-timeout',
    label: 'Network timeout',
    icon: 'wifi-off',
    severity: 'MEDIUM',
    build: () => {
      const service = pick(SERVICES);
      const downstream = pick(SERVICES.filter((s) => s !== service));
      return {
        title: `Elevated timeouts between ${service} and ${downstream}`,
        description: `${service} is seeing intermittent request timeouts (~${pct(8, 25)}% error rate) when calling ${downstream}. Latency p99 has exceeded 5s in ${pick(REGIONS)}.`,
        severity: 'MEDIUM',
        source: 'monitoring',
      };
    },
  },
  {
    id: 'pod-crash',
    label: 'Kubernetes pod crash',
    icon: 'box',
    severity: 'CRITICAL',
    build: () => {
      const service = pick(SERVICES);
      return {
        title: `CrashLoopBackOff on ${service} deployment`,
        description: `Pods for the ${service} deployment in ${pick(REGIONS)} are stuck in CrashLoopBackOff after the latest rollout. Readiness probes are failing on startup.`,
        severity: 'CRITICAL',
        source: 'kubernetes',
      };
    },
  },
];

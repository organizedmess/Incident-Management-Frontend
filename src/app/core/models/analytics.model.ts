import { IncidentStatus, Severity } from './incident.model';

// Mirrors dto.AnalyticsOverviewResponse
export interface AnalyticsOverviewResponse {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  averagePriorityScore: number;
}

// Mirrors dto.SeverityCountResponse
export interface SeverityCountResponse {
  severity: Severity;
  count: number;
}

// Mirrors dto.StatusCountResponse
export interface StatusCountResponse {
  status: IncidentStatus;
  count: number;
}

// Mirrors dto.DailyCountResponse
export interface DailyCountResponse {
  day: string;
  count: number;
}

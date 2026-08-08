import { IncidentStatus, Severity } from '../models/incident.model';

export interface StatusMeta {
  label: string;
  icon: string;
  cssClass: string;
}

export const SEVERITY_META: Record<Severity, StatusMeta> = {
  LOW: { label: 'Low', icon: 'info', cssClass: 'sev-low' },
  MEDIUM: { label: 'Medium', icon: 'circle-alert', cssClass: 'sev-medium' },
  HIGH: { label: 'High', icon: 'triangle-alert', cssClass: 'sev-high' },
  CRITICAL: { label: 'Critical', icon: 'shield-alert', cssClass: 'sev-critical' },
};

export const INCIDENT_STATUS_META: Record<IncidentStatus, StatusMeta> = {
  OPEN: { label: 'Open', icon: 'clock', cssClass: 'status-open' },
  ACKNOWLEDGED: { label: 'Acknowledged', icon: 'circle-alert', cssClass: 'status-acknowledged' },
  RESOLVED: { label: 'Resolved', icon: 'circle-check', cssClass: 'status-resolved' },
};

// Fixed severity rank so charts/sorts render CRITICAL -> LOW regardless of API order.
export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export const STATUS_ORDER: IncidentStatus[] = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

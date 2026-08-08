// Mirrors com.example.incidentmanagement.model.Severity
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Mirrors com.example.incidentmanagement.model.IncidentStatus
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

// Mirrors com.example.incidentmanagement.model.AnalysisStatus
export type AnalysisStatus = 'COMPLETED' | 'FAILED';

export const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const INCIDENT_STATUSES: IncidentStatus[] = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

// Mirrors dto.IncidentResponse
export interface IncidentResponse {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// Mirrors dto.IncidentCreateRequest
export interface IncidentCreateRequest {
  title: string;
  description: string;
  severity: Severity;
  source: string;
}

// Mirrors dto.IncidentStatusUpdateRequest
export interface IncidentStatusUpdateRequest {
  status: IncidentStatus;
}

// Mirrors dto.IncidentAnalysisResponse
export interface IncidentAnalysisResponse {
  id: number;
  incidentId: number;
  summary: string | null;
  rootCause: string | null;
  recommendedAction: string | null;
  priorityScore: number | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  createdAt: string;
}

// Mirrors dto.RecentIncidentResponse
export interface RecentIncidentResponse {
  id: number;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
}

// Mirrors exception.ErrorResponse
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors: Record<string, string> | null;
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnalyticsOverviewResponse,
  DailyCountResponse,
  SeverityCountResponse,
  StatusCountResponse,
} from '../models/analytics.model';
import { RecentIncidentResponse } from '../models/incident.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/analytics`;

  getOverview(): Observable<AnalyticsOverviewResponse> {
    return this.http.get<AnalyticsOverviewResponse>(`${this.base}/overview`);
  }

  getSeverityBreakdown(): Observable<SeverityCountResponse[]> {
    return this.http.get<SeverityCountResponse[]>(`${this.base}/severity`);
  }

  getStatusBreakdown(): Observable<StatusCountResponse[]> {
    return this.http.get<StatusCountResponse[]>(`${this.base}/status`);
  }

  getDailyCounts(): Observable<DailyCountResponse[]> {
    return this.http.get<DailyCountResponse[]>(`${this.base}/daily`);
  }

  getTrends(): Observable<DailyCountResponse[]> {
    return this.http.get<DailyCountResponse[]>(`${this.base}/trends`);
  }

  getRecentIncidents(): Observable<RecentIncidentResponse[]> {
    return this.http.get<RecentIncidentResponse[]>(`${this.base}/recent`);
  }
}

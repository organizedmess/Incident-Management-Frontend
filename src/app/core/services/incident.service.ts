import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IncidentAnalysisResponse,
  IncidentCreateRequest,
  IncidentResponse,
  IncidentStatusUpdateRequest,
} from '../models/incident.model';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/incidents`;

  getAll(): Observable<IncidentResponse[]> {
    return this.http.get<IncidentResponse[]>(this.base);
  }

  getById(id: number): Observable<IncidentResponse> {
    return this.http.get<IncidentResponse>(`${this.base}/${id}`);
  }

  create(request: IncidentCreateRequest): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(this.base, request);
  }

  updateStatus(id: number, request: IncidentStatusUpdateRequest): Observable<IncidentResponse> {
    return this.http.patch<IncidentResponse>(`${this.base}/${id}/status`, request);
  }

  getAnalysis(id: number): Observable<IncidentAnalysisResponse> {
    return this.http.get<IncidentAnalysisResponse>(`${this.base}/${id}/analysis`);
  }

  resendNotification(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/notify`, {});
  }
}

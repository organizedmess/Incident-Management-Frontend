import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, interval, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { IncidentService } from '../../core/services/incident.service';
import { BackendStatusService } from '../../core/services/backend-status.service';
import { AnalyticsOverviewResponse, DailyCountResponse, SeverityCountResponse, StatusCountResponse } from '../../core/models/analytics.model';
import { IncidentResponse } from '../../core/models/incident.model';
import { SEVERITY_META, SEVERITY_ORDER, INCIDENT_STATUS_META, STATUS_ORDER } from '../../core/utils/severity.util';
import { DEMO_OVERVIEW, DEMO_SEVERITY_BREAKDOWN, DEMO_STATUS_BREAKDOWN, DEMO_TRENDS, DEMO_INCIDENTS } from '../../core/demo/demo-data';
import { Card } from '../../shared/components/card/card';
import { KpiTile } from '../../shared/components/kpi-tile/kpi-tile';
import { DonutChart, DonutDatum } from '../../shared/components/donut-chart/donut-chart';
import { TrendChart, TrendDatum } from '../../shared/components/trend-chart/trend-chart';
import { IncidentsTable } from '../../shared/components/incidents-table/incidents-table';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { ConnectionStatus } from '../../shared/components/connection-status/connection-status';
import { SimulationPanel } from './components/simulation-panel/simulation-panel';
import { ActivityFeed, ActivityItem } from './components/activity-feed/activity-feed';

interface DashboardData {
  overview: AnalyticsOverviewResponse;
  severity: SeverityCountResponse[];
  status: StatusCountResponse[];
  trends: DailyCountResponse[];
  incidents: IncidentResponse[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Card, KpiTile, DonutChart, TrendChart, IncidentsTable, ErrorState, ConnectionStatus, SimulationPanel, ActivityFeed],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly incidentService = inject(IncidentService);
  private readonly backendStatus = inject(BackendStatusService);

  // Real backend errors (distinct from "still connecting" — see backendStatus for that).
  protected readonly error = signal(false);
  protected readonly connectionState = this.backendStatus.status;

  // Signals start pre-seeded with static demo data so the dashboard renders fully on first
  // paint instead of a blank/skeleton screen while the Render backend wakes up. `usingDemoData`
  // tracks whether what's currently on screen is that seed data or a real API response.
  protected readonly usingDemoData = signal(true);

  protected readonly overview = signal<AnalyticsOverviewResponse | null>(DEMO_OVERVIEW);
  protected readonly severityData = signal<SeverityCountResponse[]>(DEMO_SEVERITY_BREAKDOWN);
  protected readonly statusData = signal<StatusCountResponse[]>(DEMO_STATUS_BREAKDOWN);
  protected readonly trendData = signal<DailyCountResponse[]>(DEMO_TRENDS);
  protected readonly allIncidents = signal<IncidentResponse[]>(DEMO_INCIDENTS);
  protected readonly activityItems = signal<ActivityItem[]>([]);

  private readonly seenIncidentIds = new Set<number>();
  private isFirstLoad = true;

  protected readonly criticalHighCount = computed(() =>
    this.severityData()
      .filter((s) => s.severity === 'CRITICAL' || s.severity === 'HIGH')
      .reduce((sum, s) => sum + s.count, 0),
  );

  protected readonly severityDonutData = computed<DonutDatum[]>(() => {
    const bySeverity = new Map(this.severityData().map((s) => [s.severity, s.count]));
    return SEVERITY_ORDER.map((sev) => ({
      label: SEVERITY_META[sev].label,
      value: bySeverity.get(sev) ?? 0,
      colorVar: `var(--severity-${sev.toLowerCase()})`,
    }));
  });

  protected readonly statusDonutData = computed<DonutDatum[]>(() => {
    const byStatus = new Map(this.statusData().map((s) => [s.status, s.count]));
    return STATUS_ORDER.map((st) => ({
      label: INCIDENT_STATUS_META[st].label,
      value: byStatus.get(st) ?? 0,
      colorVar: `var(--incident-${st.toLowerCase()})`,
    }));
  });

  protected readonly trendChartData = computed<TrendDatum[]>(() =>
    this.trendData().map((d) => ({ day: d.day, count: d.count })),
  );

  protected readonly recentIncidents = computed<IncidentResponse[]>(() =>
    [...this.allIncidents()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6),
  );

  constructor() {
    this.backendStatus.ensureStarted();
    interval(environment.pollingIntervalMs)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected retry(): void {
    this.error.set(false);
    this.load();
  }

  protected onIncidentSimulated(): void {
    this.load();
  }

  private load(): void {
    forkJoin({
      overview: this.analyticsService.getOverview(),
      severity: this.analyticsService.getSeverityBreakdown(),
      status: this.analyticsService.getStatusBreakdown(),
      trends: this.analyticsService.getTrends(),
      incidents: this.incidentService.getAll(),
    })
      .pipe(
        catchError(() => {
          // Real request failed. If we've never had live data, keep the demo data on screen
          // (BackendStatusService drives the "waking up" / "unavailable" messaging) rather
          // than blanking the dashboard. Only show the hard error state if we somehow have
          // neither live nor demo data to fall back on.
          this.backendStatus.reportFailure();
          if (this.usingDemoData() && this.allIncidents().length === 0) {
            this.error.set(true);
          }
          return of(null);
        }),
      )
      .subscribe((data) => {
        if (!data) return;
        this.applyData(data);
        this.usingDemoData.set(false);
        this.error.set(false);
        this.backendStatus.reportSuccess();
      });
  }

  private applyData(data: DashboardData): void {
    this.overview.set(data.overview);
    this.severityData.set(data.severity);
    this.statusData.set(data.status);
    this.trendData.set(data.trends);
    this.allIncidents.set(data.incidents);
    this.updateActivityFeed(data.incidents);
  }

  private updateActivityFeed(incidents: IncidentResponse[]): void {
    const sorted = [...incidents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const top = sorted.slice(0, 15);

    const items: ActivityItem[] = top.map((incident) => ({
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.createdAt,
      isNew: !this.isFirstLoad && !this.seenIncidentIds.has(incident.id),
    }));

    this.activityItems.set(items);
    sorted.forEach((i) => this.seenIncidentIds.add(i.id));
    this.isFirstLoad = false;
  }
}

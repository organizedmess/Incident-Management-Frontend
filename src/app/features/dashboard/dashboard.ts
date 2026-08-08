import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, interval, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { IncidentService } from '../../core/services/incident.service';
import { AnalyticsOverviewResponse, DailyCountResponse, SeverityCountResponse, StatusCountResponse } from '../../core/models/analytics.model';
import { IncidentResponse } from '../../core/models/incident.model';
import { SEVERITY_META, SEVERITY_ORDER, INCIDENT_STATUS_META, STATUS_ORDER } from '../../core/utils/severity.util';
import { Card } from '../../shared/components/card/card';
import { KpiTile } from '../../shared/components/kpi-tile/kpi-tile';
import { DonutChart, DonutDatum } from '../../shared/components/donut-chart/donut-chart';
import { TrendChart, TrendDatum } from '../../shared/components/trend-chart/trend-chart';
import { IncidentsTable } from '../../shared/components/incidents-table/incidents-table';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';
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
  imports: [Card, KpiTile, DonutChart, TrendChart, IncidentsTable, ErrorState, Skeleton, SimulationPanel, ActivityFeed],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly incidentService = inject(IncidentService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly overview = signal<AnalyticsOverviewResponse | null>(null);
  protected readonly severityData = signal<SeverityCountResponse[]>([]);
  protected readonly statusData = signal<StatusCountResponse[]>([]);
  protected readonly trendData = signal<DailyCountResponse[]>([]);
  protected readonly allIncidents = signal<IncidentResponse[]>([]);
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
    interval(environment.pollingIntervalMs)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load(true));
  }

  ngOnInit(): void {
    this.load(false);
  }

  protected retry(): void {
    this.loading.set(true);
    this.load(false);
  }

  protected onIncidentSimulated(): void {
    this.load(true);
  }

  private load(isPoll: boolean): void {
    forkJoin({
      overview: this.analyticsService.getOverview(),
      severity: this.analyticsService.getSeverityBreakdown(),
      status: this.analyticsService.getStatusBreakdown(),
      trends: this.analyticsService.getTrends(),
      incidents: this.incidentService.getAll(),
    })
      .pipe(
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return of(null);
        }),
      )
      .subscribe((data) => {
        if (!data) return;
        this.applyData(data);
        this.error.set(false);
        this.loading.set(false);
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

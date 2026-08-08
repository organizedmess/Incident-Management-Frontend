import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsOverviewResponse, DailyCountResponse, SeverityCountResponse, StatusCountResponse } from '../../core/models/analytics.model';
import { INCIDENT_STATUS_META, SEVERITY_META, SEVERITY_ORDER, STATUS_ORDER } from '../../core/utils/severity.util';
import { Card } from '../../shared/components/card/card';
import { KpiTile } from '../../shared/components/kpi-tile/kpi-tile';
import { DonutChart, DonutDatum } from '../../shared/components/donut-chart/donut-chart';
import { BarList, BarDatum } from '../../shared/components/bar-list/bar-list';
import { TrendChart, TrendDatum } from '../../shared/components/trend-chart/trend-chart';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [Card, KpiTile, DonutChart, BarList, TrendChart, ErrorState, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly overview = signal<AnalyticsOverviewResponse | null>(null);
  protected readonly severityData = signal<SeverityCountResponse[]>([]);
  protected readonly statusData = signal<StatusCountResponse[]>([]);
  protected readonly trendData = signal<DailyCountResponse[]>([]);

  protected readonly resolutionRate = computed(() => {
    const overview = this.overview();
    if (!overview || overview.totalIncidents === 0) return 0;
    return Math.round((overview.resolvedIncidents / overview.totalIncidents) * 100);
  });

  protected readonly severityBarData = computed<BarDatum[]>(() => {
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

  ngOnInit(): void {
    this.load();
  }

  protected retry(): void {
    this.loading.set(true);
    this.load();
  }

  private load(): void {
    forkJoin({
      overview: this.analyticsService.getOverview(),
      severity: this.analyticsService.getSeverityBreakdown(),
      status: this.analyticsService.getStatusBreakdown(),
      trends: this.analyticsService.getTrends(),
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
        this.overview.set(data.overview);
        this.severityData.set(data.severity);
        this.statusData.set(data.status);
        this.trendData.set(data.trends);
        this.error.set(false);
        this.loading.set(false);
      });
  }
}

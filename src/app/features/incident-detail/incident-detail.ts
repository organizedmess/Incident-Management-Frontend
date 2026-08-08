import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { IncidentService } from '../../core/services/incident.service';
import { IncidentAnalysisResponse, IncidentResponse, IncidentStatus } from '../../core/models/incident.model';
import { timeAgo } from '../../core/utils/text.util';
import { INCIDENT_STATUS_META, SEVERITY_META } from '../../core/utils/severity.util';
import { Icon } from '../../shared/icon/icon';
import { SeverityBadge } from '../../shared/components/severity-badge/severity-badge';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { Card } from '../../shared/components/card/card';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';

type AnalysisPhase = 'pending' | 'ready' | 'gave-up';

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

interface TimelineEntry {
  icon: string;
  title: string;
  timestamp: string;
  tone: 'default' | 'good' | 'critical' | 'info';
}

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [RouterLink, Icon, SeverityBadge, StatusBadge, Card, ErrorState, Skeleton, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-detail.html',
  styleUrl: './incident-detail.scss',
})
export class IncidentDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly incidentService = inject(IncidentService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly incident = signal<IncidentResponse | null>(null);

  protected readonly analysis = signal<IncidentAnalysisResponse | null>(null);
  protected readonly analysisPhase = signal<AnalysisPhase>('pending');

  protected readonly updatingStatus = signal(false);
  protected readonly notifyState = signal<'idle' | 'sending' | 'sent'>('idle');

  protected readonly severityMeta = computed(() => {
    const incident = this.incident();
    return incident ? SEVERITY_META[incident.severity] : null;
  });

  protected readonly timeline = computed<TimelineEntry[]>(() => {
    const incident = this.incident();
    if (!incident) return [];
    const entries: TimelineEntry[] = [
      { icon: 'inbox', title: 'Incident reported', timestamp: incident.createdAt, tone: 'default' },
    ];

    const analysis = this.analysis();
    if (analysis) {
      entries.push(
        analysis.status === 'COMPLETED'
          ? { icon: 'brain-circuit', title: 'AI analysis completed', timestamp: analysis.createdAt, tone: 'info' }
          : { icon: 'triangle-alert', title: 'AI analysis failed', timestamp: analysis.createdAt, tone: 'critical' },
      );
    }

    if (incident.updatedAt !== incident.createdAt) {
      entries.push({
        icon: INCIDENT_STATUS_META[incident.status].icon,
        title: `Status updated to ${INCIDENT_STATUS_META[incident.status].label}`,
        timestamp: incident.updatedAt,
        tone: incident.status === 'RESOLVED' ? 'good' : 'default',
      });
    }

    return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });

  protected readonly nextStatusActions = computed<{ label: string; icon: string; status: IncidentStatus }[]>(() => {
    const incident = this.incident();
    if (!incident) return [];
    switch (incident.status) {
      case 'OPEN':
        return [
          { label: 'Acknowledge', icon: 'circle-alert', status: 'ACKNOWLEDGED' },
          { label: 'Mark resolved', icon: 'circle-check', status: 'RESOLVED' },
        ];
      case 'ACKNOWLEDGED':
        return [{ label: 'Mark resolved', icon: 'circle-check', status: 'RESOLVED' }];
      case 'RESOLVED':
        return [{ label: 'Reopen', icon: 'clock', status: 'OPEN' }];
    }
  });

  protected readonly timeAgo = timeAgo;

  private pollHandle?: ReturnType<typeof setTimeout>;
  private pollAttempt = 0;
  private activeId: number | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.resetForId(id);
          return this.incidentService.getById(id).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((incident) => {
        this.loading.set(false);
        if (!incident) {
          this.error.set(true);
          return;
        }
        this.error.set(false);
        this.incident.set(incident);
        this.pollAnalysis(incident.id);
      });
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearTimeout(this.pollHandle);
  }

  protected retry(): void {
    const id = this.incident()?.id ?? Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.resetForId(id);
    this.incidentService
      .getById(id)
      .pipe(catchError(() => of(null)))
      .subscribe((incident) => {
        this.loading.set(false);
        if (!incident) {
          this.error.set(true);
          return;
        }
        this.error.set(false);
        this.incident.set(incident);
        this.pollAnalysis(incident.id);
      });
  }

  protected updateStatus(status: IncidentStatus): void {
    const incident = this.incident();
    if (!incident) return;
    this.updatingStatus.set(true);
    this.incidentService
      .updateStatus(incident.id, { status })
      .pipe(catchError(() => of(null)))
      .subscribe((updated) => {
        this.updatingStatus.set(false);
        if (updated) this.incident.set(updated);
      });
  }

  protected resendNotification(): void {
    const incident = this.incident();
    if (!incident) return;
    this.notifyState.set('sending');
    this.incidentService
      .resendNotification(incident.id)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.notifyState.set('sent');
        setTimeout(() => this.notifyState.set('idle'), 3000);
      });
  }

  protected goBack(): void {
    this.router.navigate(['/incidents']);
  }

  private resetForId(id: number): void {
    if (this.pollHandle) clearTimeout(this.pollHandle);
    this.activeId = id;
    this.pollAttempt = 0;
    this.analysis.set(null);
    this.analysisPhase.set('pending');
  }

  private pollAnalysis(id: number): void {
    this.incidentService
      .getAnalysis(id)
      .pipe(catchError(() => of(null)))
      .subscribe((analysis) => {
        if (this.activeId !== id) return; // navigated away — ignore stale response

        if (analysis) {
          this.analysis.set(analysis);
          this.analysisPhase.set('ready');
          return;
        }

        this.pollAttempt++;
        if (this.pollAttempt >= MAX_POLL_ATTEMPTS) {
          this.analysisPhase.set('gave-up');
          return;
        }
        this.pollHandle = setTimeout(() => this.pollAnalysis(id), POLL_INTERVAL_MS);
      });
  }
}

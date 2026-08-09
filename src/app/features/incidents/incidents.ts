import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { IncidentService } from '../../core/services/incident.service';
import { BackendStatusService } from '../../core/services/backend-status.service';
import { IncidentResponse, IncidentStatus, Severity } from '../../core/models/incident.model';
import { SEVERITY_ORDER, STATUS_ORDER } from '../../core/utils/severity.util';
import { DEMO_INCIDENTS } from '../../core/demo/demo-data';
import { Card } from '../../shared/components/card/card';
import { IncidentsTable } from '../../shared/components/incidents-table/incidents-table';
import { Pagination } from '../../shared/components/pagination/pagination';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { ConnectionStatus } from '../../shared/components/connection-status/connection-status';
import { FilterBar, SortOption } from './components/filter-bar/filter-bar';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [Card, IncidentsTable, Pagination, ErrorState, ConnectionStatus, FilterBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incidents.html',
  styleUrl: './incidents.scss',
})
export class Incidents implements OnInit {
  private readonly incidentService = inject(IncidentService);
  private readonly backendStatus = inject(BackendStatusService);

  protected readonly error = signal(false);
  protected readonly connectionState = this.backendStatus.status;
  protected readonly usingDemoData = signal(true);
  protected readonly allIncidents = signal<IncidentResponse[]>(DEMO_INCIDENTS);

  protected readonly searchTerm = signal('');
  protected readonly severities = signal<Severity[]>([]);
  protected readonly statuses = signal<IncidentStatus[]>([]);
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly sortBy = signal<SortOption>('newest');
  protected readonly page = signal(1);

  protected readonly pageSize = PAGE_SIZE;

  protected readonly filteredIncidents = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const severities = this.severities();
    const statuses = this.statuses();
    const from = this.dateFrom() ? new Date(this.dateFrom()).getTime() : null;
    const to = this.dateTo() ? new Date(this.dateTo()).getTime() + 86_400_000 - 1 : null;

    let result = this.allIncidents().filter((incident) => {
      if (term) {
        const haystack = `${incident.title} ${incident.description} ${incident.source}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (severities.length > 0 && !severities.includes(incident.severity)) return false;
      if (statuses.length > 0 && !statuses.includes(incident.status)) return false;

      const createdAt = new Date(incident.createdAt).getTime();
      if (from !== null && createdAt < from) return false;
      if (to !== null && createdAt > to) return false;

      return true;
    });

    result = this.applySort(result);
    return result;
  });

  protected readonly pagedIncidents = computed(() => {
    const page = this.page();
    const start = (page - 1) * this.pageSize;
    return this.filteredIncidents().slice(start, start + this.pageSize);
  });

  constructor() {
    // Any filter/sort change invalidates the current page — jump back to page 1 so the
    // reader never lands on a page that no longer has any matching rows.
    effect(() => {
      this.searchTerm();
      this.severities();
      this.statuses();
      this.dateFrom();
      this.dateTo();
      this.sortBy();
      this.page.set(1);
    });
  }

  ngOnInit(): void {
    this.backendStatus.ensureStarted();
    this.load();
  }

  protected retry(): void {
    this.error.set(false);
    this.load();
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
  }

  private load(): void {
    this.incidentService
      .getAll()
      .pipe(
        catchError(() => {
          this.backendStatus.reportFailure();
          if (this.usingDemoData() && this.allIncidents().length === 0) {
            this.error.set(true);
          }
          return of(null);
        }),
      )
      .subscribe((incidents) => {
        if (!incidents) return;
        this.allIncidents.set(incidents);
        this.usingDemoData.set(false);
        this.error.set(false);
        this.backendStatus.reportSuccess();
      });
  }

  private applySort(incidents: IncidentResponse[]): IncidentResponse[] {
    const sorted = [...incidents];
    switch (this.sortBy()) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'severity':
        return sorted.sort(
          (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
        );
      case 'status':
        return sorted.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }
}

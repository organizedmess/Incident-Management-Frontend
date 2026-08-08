import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IncidentStatus, Severity } from '../../../../core/models/incident.model';
import { INCIDENT_STATUS_META, SEVERITY_META, SEVERITY_ORDER, STATUS_ORDER } from '../../../../core/utils/severity.util';
import { Icon } from '../../../../shared/icon/icon';

export type SortOption = 'newest' | 'oldest' | 'severity' | 'status';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <div class="search-field">
        <app-icon name="search" [size]="15" />
        <input
          type="search"
          placeholder="Search by title, description or service…"
          [(ngModel)]="searchTerm"
        />
      </div>

      <div class="date-field">
        <label>
          From
          <input type="date" [(ngModel)]="dateFrom" />
        </label>
        <label>
          To
          <input type="date" [(ngModel)]="dateTo" />
        </label>
      </div>

      <div class="sort-field">
        <app-icon name="chevrons-up-down" [size]="14" />
        <select [(ngModel)]="sortBy">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="severity">Highest severity</option>
          <option value="status">Status</option>
        </select>
      </div>
    </div>

    <div class="row chip-row">
      <div class="chip-group">
        <span class="chip-group-label">Severity</span>
        @for (sev of severityOptions; track sev) {
          <button
            type="button"
            class="chip"
            [class.active]="severities().includes(sev)"
            (click)="toggleSeverity(sev)"
          >
            {{ severityLabel(sev) }}
          </button>
        }
      </div>

      <div class="chip-group">
        <span class="chip-group-label">Status</span>
        @for (st of statusOptions; track st) {
          <button
            type="button"
            class="chip"
            [class.active]="statuses().includes(st)"
            (click)="toggleStatus(st)"
          >
            {{ statusLabel(st) }}
          </button>
        }
      </div>

      @if (hasActiveFilters()) {
        <button type="button" class="clear-btn" (click)="clearAll()">
          <app-icon name="x" [size]="13" />
          Clear filters
        </button>
      }
    </div>
  `,
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  readonly searchTerm = model<string>('');
  readonly severities = model<Severity[]>([]);
  readonly statuses = model<IncidentStatus[]>([]);
  readonly dateFrom = model<string>('');
  readonly dateTo = model<string>('');
  readonly sortBy = model<SortOption>('newest');

  protected readonly severityOptions = SEVERITY_ORDER;
  protected readonly statusOptions = STATUS_ORDER;

  protected severityLabel(sev: Severity): string {
    return SEVERITY_META[sev].label;
  }

  protected statusLabel(st: IncidentStatus): string {
    return INCIDENT_STATUS_META[st].label;
  }

  protected toggleSeverity(sev: Severity): void {
    const current = this.severities();
    this.severities.set(
      current.includes(sev) ? current.filter((s) => s !== sev) : [...current, sev],
    );
  }

  protected toggleStatus(st: IncidentStatus): void {
    const current = this.statuses();
    this.statuses.set(current.includes(st) ? current.filter((s) => s !== st) : [...current, st]);
  }

  protected hasActiveFilters(): boolean {
    return (
      this.searchTerm() !== '' ||
      this.severities().length > 0 ||
      this.statuses().length > 0 ||
      this.dateFrom() !== '' ||
      this.dateTo() !== ''
    );
  }

  protected clearAll(): void {
    this.searchTerm.set('');
    this.severities.set([]);
    this.statuses.set([]);
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}

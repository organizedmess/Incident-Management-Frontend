import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { IncidentResponse } from '../../../core/models/incident.model';
import { timeAgo } from '../../../core/utils/text.util';
import { SeverityBadge } from '../severity-badge/severity-badge';
import { StatusBadge } from '../status-badge/status-badge';
import { EmptyState } from '../empty-state/empty-state';
import { Skeleton } from '../skeleton/skeleton';
import { Icon } from '../../icon/icon';

@Component({
  selector: 'app-incidents-table',
  standalone: true,
  imports: [SeverityBadge, StatusBadge, EmptyState, Skeleton, Icon, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Service</th>
            <th>Reported</th>
            <th class="col-chevron"></th>
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (row of skeletonRows; track row) {
              <tr class="skeleton-row">
                <td><app-skeleton width="28px" /></td>
                <td><app-skeleton width="70%" /></td>
                <td><app-skeleton width="60px" height="20px" /></td>
                <td><app-skeleton width="70px" height="20px" /></td>
                <td><app-skeleton width="90px" /></td>
                <td><app-skeleton width="60px" /></td>
                <td></td>
              </tr>
            }
          } @else {
            @for (incident of incidents(); track incident.id) {
              <tr (click)="goToDetail(incident.id)" tabindex="0" (keydown.enter)="goToDetail(incident.id)">
                <td class="col-id tabular">#{{ incident.id }}</td>
                <td class="col-title">{{ incident.title }}</td>
                <td><app-severity-badge [severity]="incident.severity" /></td>
                <td><app-status-badge [status]="incident.status" /></td>
                <td class="col-source">{{ incident.source }}</td>
                <td class="col-time tabular" [title]="incident.createdAt | date: 'medium'">
                  {{ timeAgo(incident.createdAt) }}
                </td>
                <td class="col-chevron"><app-icon name="chevron-right" [size]="16" /></td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    @if (!loading() && incidents().length === 0) {
      <app-empty-state icon="inbox" title="No incidents" [message]="emptyMessage()" />
    }
  `,
  styleUrl: './incidents-table.scss',
})
export class IncidentsTable {
  readonly incidents = input.required<IncidentResponse[]>();
  readonly loading = input<boolean>(false);
  readonly emptyMessage = input<string>('Nothing to show here yet.');

  protected readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);
  protected readonly timeAgo = timeAgo;

  constructor(private readonly router: Router) {}

  protected goToDetail(id: number): void {
    this.router.navigate(['/incidents', id]);
  }
}

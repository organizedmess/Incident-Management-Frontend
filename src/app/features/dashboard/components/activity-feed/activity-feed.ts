import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { IncidentStatus, Severity } from '../../../../core/models/incident.model';
import { timeAgo } from '../../../../core/utils/text.util';
import { SEVERITY_META } from '../../../../core/utils/severity.util';
import { Icon } from '../../../../shared/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

export interface ActivityItem {
  id: number;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
  isNew: boolean;
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [Icon, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length === 0) {
      <app-empty-state icon="activity" title="No activity yet" message="Simulated or reported incidents will appear here in real time." />
    } @else {
      <ul class="feed">
        @for (item of items(); track item.id) {
          <li class="feed-item" [class.is-new]="item.isNew" (click)="goToDetail(item.id)">
            <span class="icon-chip" [class]="meta(item.severity).cssClass">
              <app-icon [name]="meta(item.severity).icon" [size]="14" [strokeWidth]="2.5" />
            </span>
            <div class="feed-content">
              <p class="feed-title">{{ item.title }}</p>
              <p class="feed-meta">
                <span>#{{ item.id }}</span>
                <span class="dot-sep">·</span>
                <span>{{ timeAgo(item.createdAt) }}</span>
              </p>
            </div>
            @if (item.isNew) {
              <span class="new-tag">New</span>
            }
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './activity-feed.scss',
})
export class ActivityFeed {
  readonly items = input.required<ActivityItem[]>();
  protected readonly timeAgo = timeAgo;
  protected readonly meta = (s: Severity) => SEVERITY_META[s];

  constructor(private readonly router: Router) {}

  protected goToDetail(id: number): void {
    this.router.navigate(['/incidents', id]);
  }
}

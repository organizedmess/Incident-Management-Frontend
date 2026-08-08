import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../../icon/icon';
import { IncidentStatus } from '../../../core/models/incident.model';
import { INCIDENT_STATUS_META } from '../../../core/utils/severity.util';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="meta().cssClass">
      <app-icon [name]="meta().icon" [size]="13" [strokeWidth]="2.5" />
      {{ meta().label }}
    </span>
  `,
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  readonly status = input.required<IncidentStatus>();
  protected readonly meta = computed(() => INCIDENT_STATUS_META[this.status()]);
}

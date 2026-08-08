import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../../icon/icon';
import { Severity } from '../../../core/models/incident.model';
import { SEVERITY_META } from '../../../core/utils/severity.util';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="meta().cssClass">
      <app-icon [name]="meta().icon" [size]="13" [strokeWidth]="2.5" />
      {{ meta().label }}
    </span>
  `,
  styleUrl: './severity-badge.scss',
})
export class SeverityBadge {
  readonly severity = input.required<Severity>();
  protected readonly meta = computed(() => SEVERITY_META[this.severity()]);
}

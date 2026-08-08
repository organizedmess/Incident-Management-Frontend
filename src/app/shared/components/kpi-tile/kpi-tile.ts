import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../../icon/icon';

export type KpiTone = 'default' | 'critical' | 'good' | 'warning' | 'info';

@Component({
  selector: 'app-kpi-tile',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon-chip" [class]="'tone-' + tone()">
      <app-icon [name]="icon()" [size]="18" [strokeWidth]="2" />
    </div>
    <div class="content">
      <p class="label">{{ label() }}</p>
      @if (loading()) {
        <div class="value-skeleton"></div>
      } @else {
        <p class="value tabular">{{ value() }}</p>
      }
      @if (hint() && !loading()) {
        <p class="hint">{{ hint() }}</p>
      }
    </div>
  `,
  styleUrl: './kpi-tile.scss',
  host: { class: 'app-kpi-tile' },
})
export class KpiTile {
  readonly label = input.required<string>();
  readonly value = input<string | number>('');
  readonly icon = input.required<string>();
  readonly tone = input<KpiTone>('default');
  readonly hint = input<string>('');
  readonly loading = input<boolean>(false);
}

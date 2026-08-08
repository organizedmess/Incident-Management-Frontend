import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
  colorVar: string;
}

@Component({
  selector: 'app-bar-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar-list">
      @for (row of rows(); track row.label) {
        <div class="bar-row">
          <span class="bar-label">{{ row.label }}</span>
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="row.percent" [style.background]="row.colorVar"></div>
          </div>
          <span class="bar-value tabular">{{ row.value }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './bar-list.scss',
})
export class BarList {
  readonly data = input.required<BarDatum[]>();

  protected readonly rows = computed(() => {
    const items = this.data();
    const max = Math.max(1, ...items.map((d) => d.value));
    return items.map((d) => ({ ...d, percent: (d.value / max) * 100 }));
  });
}

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface DonutDatum {
  label: string;
  value: number;
  colorVar: string; // e.g. 'var(--severity-critical)'
}

interface Segment extends DonutDatum {
  percent: number;
  dashArray: string;
  dashOffset: number;
}

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // px of surface-colored gap between segments

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut-wrap">
      <svg viewBox="0 0 140 140" class="donut-svg">
        <circle class="track" cx="70" cy="70" [attr.r]="radius" />
        @for (seg of segments(); track seg.label; let i = $index) {
          <circle
            class="segment"
            cx="70"
            cy="70"
            [attr.r]="radius"
            [style.stroke]="seg.colorVar"
            [style.strokeDasharray]="seg.dashArray"
            [style.strokeDashoffset]="seg.dashOffset"
            [class.dimmed]="hovered() !== null && hovered() !== i"
            (pointerenter)="hovered.set(i)"
            (pointerleave)="hovered.set(null)"
            (focus)="hovered.set(i)"
            (blur)="hovered.set(null)"
            tabindex="0"
            role="img"
            [attr.aria-label]="seg.label + ': ' + seg.value"
          />
        }
      </svg>
      <div class="center">
        @if (hovered() === null) {
          <p class="center-value tabular">{{ total() }}</p>
          <p class="center-label">{{ centerLabel() }}</p>
        } @else {
          <p class="center-value tabular">{{ segments()[hovered()!].value }}</p>
          <p class="center-label">{{ segments()[hovered()!].label }}</p>
        }
      </div>
    </div>
    <ul class="legend">
      @for (seg of segments(); track seg.label; let i = $index) {
        <li
          [class.dimmed]="hovered() !== null && hovered() !== i"
          (pointerenter)="hovered.set(i)"
          (pointerleave)="hovered.set(null)"
        >
          <span class="dot" [style.background]="seg.colorVar"></span>
          <span class="legend-label">{{ seg.label }}</span>
          <span class="legend-value tabular">{{ seg.value }}</span>
        </li>
      }
    </ul>
  `,
  styleUrl: './donut-chart.scss',
})
export class DonutChart {
  readonly data = input.required<DonutDatum[]>();
  readonly centerLabel = input<string>('Total');

  protected readonly radius = RADIUS;
  protected readonly hovered = signal<number | null>(null);

  protected readonly total = computed(() => this.data().reduce((sum, d) => sum + d.value, 0));

  protected readonly segments = computed<Segment[]>(() => {
    const items = this.data();
    const total = this.total();
    if (total === 0) {
      return items.map((d) => ({ ...d, percent: 0, dashArray: `0 ${CIRCUMFERENCE}`, dashOffset: 0 }));
    }

    const visibleCount = items.filter((d) => d.value > 0).length;
    let cumulative = 0;
    return items.map((d) => {
      const percent = d.value / total;
      const rawLength = percent * CIRCUMFERENCE;
      const gap = d.value > 0 && visibleCount > 1 ? GAP : 0;
      const length = Math.max(rawLength - gap, 0);
      const dashArray = `${length} ${CIRCUMFERENCE - length}`;
      // Quarter-turn (-90deg) start so the first segment begins at 12 o'clock.
      const dashOffset = -((cumulative / CIRCUMFERENCE) * CIRCUMFERENCE) - CIRCUMFERENCE * 0.25 + gap / 2;
      cumulative += rawLength;
      return { ...d, percent, dashArray, dashOffset };
    });
  });
}

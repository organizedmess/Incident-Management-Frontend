import { ChangeDetectionStrategy, Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';

export interface TrendDatum {
  day: string; // ISO date, e.g. 2026-08-08
  count: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrap">
      <svg
        #svgEl
        [attr.viewBox]="'0 0 ' + width + ' ' + height"
        class="trend-svg"
        (pointermove)="onPointerMove($event)"
        (pointerleave)="hoverIndex.set(null)"
      >
        <!-- gridlines -->
        @for (tick of yTicks(); track tick) {
          <line
            class="gridline"
            [attr.x1]="padLeft"
            [attr.x2]="width - padRight"
            [attr.y1]="yFor(tick)"
            [attr.y2]="yFor(tick)"
          />
          <text class="axis-label" [attr.x]="padLeft - 8" [attr.y]="yFor(tick) + 3" text-anchor="end">
            {{ tick }}
          </text>
        }

        <!-- x-axis date labels (sparse) -->
        @for (item of xLabels(); track item.index) {
          <text class="axis-label" [attr.x]="xFor(item.index)" [attr.y]="height - 6" text-anchor="middle">
            {{ item.label }}
          </text>
        }

        <!-- baseline -->
        <line
          class="baseline"
          [attr.x1]="padLeft"
          [attr.x2]="width - padRight"
          [attr.y1]="yFor(0)"
          [attr.y2]="yFor(0)"
        />

        <!-- area fill -->
        <path class="area" [attr.d]="areaPath()" />
        <!-- line -->
        <path class="line" [attr.d]="linePath()" />

        <!-- crosshair -->
        @if (hoverIndex(); as idx) {
          <line class="crosshair" [attr.x1]="xFor(idx)" [attr.x2]="xFor(idx)" [attr.y1]="padTop" [attr.y2]="yFor(0)" />
          <circle class="marker" [attr.cx]="xFor(idx)" [attr.cy]="yFor(data()[idx].count)" r="4" />
        }
      </svg>

      @if (hoverIndex(); as idx) {
        <div class="tooltip" [style.left.px]="tooltipLeft(idx)" [style.top.px]="8">
          <p class="tooltip-value tabular">{{ data()[idx].count }} incident{{ data()[idx].count === 1 ? '' : 's' }}</p>
          <p class="tooltip-date">{{ formatDate(data()[idx].day) }}</p>
        </div>
      }
    </div>
  `,
  styleUrl: './trend-chart.scss',
})
export class TrendChart {
  readonly data = input.required<TrendDatum[]>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly padLeft = PAD_LEFT;
  protected readonly padRight = PAD_RIGHT;
  protected readonly padTop = PAD_TOP;

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svgEl');
  protected readonly hoverIndex = signal<number | null>(null);

  private readonly plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  private readonly plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  private static readonly TICK_STEPS = 4;

  // Nice-number tick step (1/2/5 * 10^n) so gridlines land on clean values like
  // 0/5/10/15/20 instead of arbitrary fractions of the data max.
  protected readonly tickStep = computed(() => {
    const max = Math.max(1, ...this.data().map((d) => d.count));
    const roughStep = max / TrendChart.TICK_STEPS;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    const niceMultiple = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceMultiple * magnitude;
  });

  protected readonly maxValue = computed(() => this.tickStep() * TrendChart.TICK_STEPS);

  protected readonly yTicks = computed<number[]>(() => {
    const step = this.tickStep();
    return Array.from({ length: TrendChart.TICK_STEPS + 1 }, (_, i) => Math.round(step * i));
  });

  protected readonly xLabels = computed(() => {
    const items = this.data();
    if (items.length === 0) return [];
    const targetCount = 6;
    const step = Math.max(1, Math.round(items.length / targetCount));
    const labels: { index: number; label: string }[] = [];
    for (let i = 0; i < items.length; i += step) {
      labels.push({ index: i, label: this.formatShortDate(items[i].day) });
    }
    const lastIndex = items.length - 1;
    if (labels[labels.length - 1]?.index !== lastIndex) {
      labels.push({ index: lastIndex, label: this.formatShortDate(items[lastIndex].day) });
    }
    return labels;
  });

  protected xFor(index: number): number {
    const items = this.data();
    if (items.length <= 1) return this.padLeft;
    return this.padLeft + (index / (items.length - 1)) * this.plotWidth;
  }

  protected yFor(value: number): number {
    const max = this.maxValue();
    return PAD_TOP + this.plotHeight - (value / max) * this.plotHeight;
  }

  protected readonly linePath = computed(() => {
    const items = this.data();
    return items.map((d, i) => `${i === 0 ? 'M' : 'L'} ${this.xFor(i)} ${this.yFor(d.count)}`).join(' ');
  });

  protected readonly areaPath = computed(() => {
    const items = this.data();
    if (items.length === 0) return '';
    const line = this.linePath();
    const lastX = this.xFor(items.length - 1);
    const baseY = this.yFor(0);
    return `${line} L ${lastX} ${baseY} L ${this.xFor(0)} ${baseY} Z`;
  });

  protected onPointerMove(event: PointerEvent): void {
    const svg = this.svgRef()?.nativeElement;
    const items = this.data();
    if (!svg || items.length === 0) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const localX = (event.clientX - rect.left) * scaleX;
    const ratio = (localX - this.padLeft) / this.plotWidth;
    const index = Math.min(items.length - 1, Math.max(0, Math.round(ratio * (items.length - 1))));
    this.hoverIndex.set(index);
  }

  protected tooltipLeft(index: number): number {
    const svg = this.svgRef()?.nativeElement;
    if (!svg) return 0;
    const pxPerUnit = svg.getBoundingClientRect().width / this.width;
    const x = this.xFor(index) * pxPerUnit;
    return Math.min(Math.max(x - 54, 0), svg.getBoundingClientRect().width - 108);
  }

  protected formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatShortDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

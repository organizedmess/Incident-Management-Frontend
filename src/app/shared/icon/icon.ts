import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICON_DATA, IconNode } from './icon-data';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="app-icon"
    >
      @for (node of nodes(); track $index) {
        @let attrs = node[1];
        @switch (node[0]) {
          @case ('path') {
            <svg:path [attr.d]="attrs['d']" />
          }
          @case ('circle') {
            <svg:circle [attr.cx]="attrs['cx']" [attr.cy]="attrs['cy']" [attr.r]="attrs['r']" />
          }
          @case ('ellipse') {
            <svg:ellipse
              [attr.cx]="attrs['cx']"
              [attr.cy]="attrs['cy']"
              [attr.rx]="attrs['rx']"
              [attr.ry]="attrs['ry']"
            />
          }
          @case ('rect') {
            <svg:rect
              [attr.x]="attrs['x']"
              [attr.y]="attrs['y']"
              [attr.width]="attrs['width']"
              [attr.height]="attrs['height']"
              [attr.rx]="attrs['rx']"
            />
          }
          @case ('line') {
            <svg:line
              [attr.x1]="attrs['x1']"
              [attr.y1]="attrs['y1']"
              [attr.x2]="attrs['x2']"
              [attr.y2]="attrs['y2']"
            />
          }
          @case ('polyline') {
            <svg:polyline [attr.points]="attrs['points']" />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    .app-icon {
      display: block;
    }
  `,
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(2);

  protected readonly nodes = computed<IconNode[]>(() => ICON_DATA[this.name()] ?? []);
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../../icon/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon-wrap">
      <app-icon name="triangle-alert" [size]="24" [strokeWidth]="1.75" />
    </div>
    <p class="title">{{ title() }}</p>
    <p class="message">{{ message() }}</p>
    <button type="button" class="retry-btn" (click)="retry.emit()">
      <app-icon name="refresh-cw" [size]="14" />
      Try again
    </button>
  `,
  styleUrl: './error-state.scss',
  host: { class: 'app-error-state' },
})
export class ErrorState {
  readonly title = input<string>('Something went wrong');
  readonly message = input<string>('Could not load this data. Please try again.');
  readonly retry = output<void>();
}

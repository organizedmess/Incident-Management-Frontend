import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../../icon/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon-wrap">
      <app-icon [name]="icon()" [size]="26" [strokeWidth]="1.75" />
    </div>
    <p class="title">{{ title() }}</p>
    @if (message()) {
      <p class="message">{{ message() }}</p>
    }
    <ng-content />
  `,
  styleUrl: './empty-state.scss',
  host: { class: 'app-empty-state' },
})
export class EmptyState {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}

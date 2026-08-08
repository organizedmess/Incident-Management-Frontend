import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title() || subtitle()) {
      <div class="card-header">
        <div class="card-heading">
          @if (title()) {
            <h3 class="card-title">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="card-subtitle">{{ subtitle() }}</p>
          }
        </div>
        <div class="card-actions">
          <ng-content select="[card-actions]" />
        </div>
      </div>
    }
    <div class="card-body">
      <ng-content />
    </div>
  `,
  styleUrl: './card.scss',
  host: { class: 'app-card' },
})
export class Card {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
}

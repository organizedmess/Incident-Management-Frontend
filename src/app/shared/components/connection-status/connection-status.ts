import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BackendStatusService } from '../../../core/services/backend-status.service';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status-pill" [class]="'state-' + status()">
      <span class="status-dot"></span>
      <span class="status-text">
        <span class="status-title">{{ title() }}</span>
        <span class="status-sub">{{ subtitle() }}</span>
      </span>
    </div>
  `,
  styleUrl: './connection-status.scss',
  host: { class: 'app-connection-status' },
})
export class ConnectionStatus {
  private readonly backendStatus = inject(BackendStatusService);

  protected readonly status = this.backendStatus.status;

  protected readonly title = computed(() => {
    switch (this.status()) {
      case 'connecting':
        return 'Backend is waking up from its slumber...';
      case 'unavailable':
        return 'Live backend unavailable';
      case 'connected':
      default:
        return 'Live monitoring';
    }
  });

  protected readonly subtitle = computed(() => {
    switch (this.status()) {
      case 'connecting':
        return 'Connecting to live data';
      case 'unavailable':
        return 'Showing last known data — retrying in background';
      case 'connected':
      default:
        return 'Connected to backend';
    }
  });
}

import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { IncidentService } from '../../../../core/services/incident.service';
import { SIMULATION_SCENARIOS } from '../../../../core/models/simulation.model';
import { IncidentResponse } from '../../../../core/models/incident.model';
import { Icon } from '../../../../shared/icon/icon';

@Component({
  selector: 'app-simulation-panel',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      @for (scenario of scenarios; track scenario.id) {
        <button
          type="button"
          class="scenario-btn"
          [class]="'sev-' + scenario.severity.toLowerCase()"
          [disabled]="firingId() === scenario.id"
          (click)="fire(scenario)"
        >
          <span class="icon-chip">
            @if (firingId() === scenario.id) {
              <app-icon name="loader-circle" [size]="16" class="spin" />
            } @else {
              <app-icon [name]="scenario.icon" [size]="16" />
            }
          </span>
          <span class="scenario-label">{{ scenario.label }}</span>
        </button>
      }
    </div>
    @if (errorMessage()) {
      <p class="error-msg">
        <app-icon name="triangle-alert" [size]="13" />
        {{ errorMessage() }}
      </p>
    }
  `,
  styleUrl: './simulation-panel.scss',
})
export class SimulationPanel {
  private readonly incidentService = inject(IncidentService);

  readonly created = output<IncidentResponse>();

  protected readonly scenarios = SIMULATION_SCENARIOS;
  protected readonly firingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected fire(scenario: (typeof SIMULATION_SCENARIOS)[number]): void {
    this.firingId.set(scenario.id);
    this.errorMessage.set(null);

    this.incidentService
      .create(scenario.build())
      .pipe(
        catchError(() => {
          this.errorMessage.set(`Could not trigger "${scenario.label}". Is the backend running?`);
          return of(null);
        }),
        finalize(() => this.firingId.set(null)),
      )
      .subscribe((incident) => {
        if (incident) {
          this.created.emit(incident);
        }
      });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export type BackendConnectionState = 'connecting' | 'connected' | 'unavailable';

// Render's free tier can take 30-60s+ to wake a sleeping instance. These retries are the
// *initial* connection attempt only — spaced out so we don't hammer the backend while it
// boots. Once a first response arrives (success or failure), ongoing freshness is driven by
// each page's existing polling interval, not by this service.
const RETRY_DELAYS_MS = [2000, 4000, 6000, 8000, 10000, 10000, 10000, 10000];

@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<BackendConnectionState>('connecting');
  readonly status = this.state.asReadonly();

  private started = false;

  /** Kick off the initial wake-up probe. Safe to call multiple times; only runs once. */
  ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    this.probe();
  }

  /** Called by pages after their own real API calls succeed/fail, to keep state current. */
  reportSuccess(): void {
    this.state.set('connected');
  }

  reportFailure(): void {
    // Only downgrade if we're not already mid-initial-connection; the probe owns that phase.
    if (this.state() === 'connected') {
      this.state.set('unavailable');
    }
  }

  private probe(attempt = 0): void {
    this.http
      .get(`${environment.apiBaseUrl}/analytics/overview`)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result !== null) {
          this.state.set('connected');
          return;
        }

        if (attempt >= RETRY_DELAYS_MS.length) {
          this.state.set('unavailable');
          return;
        }

        timer(RETRY_DELAYS_MS[attempt]).subscribe(() => this.probe(attempt + 1));
      });
  }
}

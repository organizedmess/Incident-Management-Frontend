import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Icon } from '../../shared/icon/icon';
import { ConnectionStatus } from '../../shared/components/connection-status/connection-status';
import { BackendStatusService } from '../../core/services/backend-status.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Incidents', path: '/incidents', icon: 'list-checks' },
  { label: 'Analytics', path: '/analytics', icon: 'chart-pie' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ConnectionStatus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly backendStatus = inject(BackendStatusService);

  protected readonly navItems = NAV_ITEMS;
  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);

  constructor(router: Router) {
    this.backendStatus.ensureStarted();
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileOpen.set(false);
    });
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  protected toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }
}

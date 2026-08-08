import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../../icon/icon';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="summary">
      Showing <strong>{{ rangeStart() }}–{{ rangeEnd() }}</strong> of <strong>{{ totalItems() }}</strong>
    </p>
    <div class="controls">
      <button
        type="button"
        class="nav-btn"
        aria-label="Previous page"
        [disabled]="page() <= 1"
        (click)="pageChange.emit(page() - 1)"
      >
        <app-icon name="chevron-left" [size]="16" />
      </button>
      <span class="page-indicator tabular">Page {{ page() }} of {{ totalPages() }}</span>
      <button
        type="button"
        class="nav-btn"
        aria-label="Next page"
        [disabled]="page() >= totalPages()"
        (click)="pageChange.emit(page() + 1)"
      >
        <app-icon name="chevron-right" [size]="16" />
      </button>
    </div>
  `,
  styleUrl: './pagination.scss',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input<number>(10);
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  protected readonly rangeStart = computed(() =>
    this.totalItems() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.totalItems()));
}

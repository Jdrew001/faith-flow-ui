import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  template: `
    <div class="skeleton-loader" [ngClass]="type">
      <div class="skeleton-item" *ngFor="let item of getSkeletonItems()"></div>
    </div>
  `,
  styleUrls: ['./skeleton-loader.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'list' | 'chart' | 'stat' = 'card';
  @Input() lines: number = 3;

  getSkeletonItems(): number[] {
    return Array(this.lines).fill(0);
  }
}

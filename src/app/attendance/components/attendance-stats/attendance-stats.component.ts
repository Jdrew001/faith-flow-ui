import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-attendance-stats',
  templateUrl: './attendance-stats.component.html',
  styleUrls: ['./attendance-stats.component.scss'],
  standalone: false
})
export class AttendanceStatsComponent {
  @Input() stats: any;

  formatGrowth(growth: number | undefined): string {
    if (!growth && growth !== 0) return '0%';
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  }

  getGrowthIcon(growth: number | undefined): string {
    if (!growth && growth !== 0) return 'remove';
    return growth > 0 ? 'trending-up' : growth < 0 ? 'trending-down' : 'remove';
  }

  getGrowthColor(growth: number | undefined): string {
    if (!growth && growth !== 0) return 'medium';
    return growth > 0 ? 'success' : growth < 0 ? 'danger' : 'medium';
  }
}

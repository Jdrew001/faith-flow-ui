import { Component, Input } from '@angular/core';
import { TimeUtils } from '../../../shared/utils/time.utils';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss'],
  standalone: false
})
export class SessionCardComponent {
  @Input() session: any;

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'warning';
      case 'active': return 'success';
      case 'completed': return 'medium';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'upcoming': return 'time';
      case 'active': return 'radio';
      case 'completed': return 'checkmark-circle';
      default: return 'help';
    }
  }

  getAttendanceColor(rate: number): string {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'danger';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return TimeUtils.formatTime12Hour(time);
  }
}

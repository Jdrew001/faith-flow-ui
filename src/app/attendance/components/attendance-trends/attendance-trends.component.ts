import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-attendance-trends',
  templateUrl: './attendance-trends.component.html',
  styleUrls: ['./attendance-trends.component.scss'],
  standalone: false
})
export class AttendanceTrendsComponent {
  @Input() trends: any;
  selectedPeriod = 'month';

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    // TODO: Reload trends data for selected period
    console.log('Period changed to:', this.selectedPeriod);
  }
}

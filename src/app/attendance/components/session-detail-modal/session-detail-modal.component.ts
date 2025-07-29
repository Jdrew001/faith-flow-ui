import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AttendanceService } from '../../../services/attendance.service';
import { AttendanceRecord, Session } from '../../../models/attendance.model';

@Component({
  selector: 'app-session-detail-modal',
  templateUrl: './session-detail-modal.component.html',
  styleUrls: ['./session-detail-modal.component.scss'],
  standalone: false
})
export class SessionDetailModalComponent implements OnInit {
  @Input() session!: Session;
  
  attendanceRecords: AttendanceRecord[] = [];
  isLoading = true;
  selectedTab = 'overview';

  constructor(
    private modalCtrl: ModalController,
    private attendanceService: AttendanceService
  ) {}

  async ngOnInit() {
    await this.loadAttendanceData();
  }

  private async loadAttendanceData() {
    try {
      this.isLoading = true;
      this.attendanceRecords = await this.attendanceService.getSessionAttendance(this.session.id);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  setSelectedTab(tab: string) {
    this.selectedTab = tab;
  }

  async markAttendance(personId: string, status: 'Present' | 'Absent') {
    try {
      await this.attendanceService.markAttendance(this.session.id, personId, status);
      await this.loadAttendanceData();
      this.dismiss({ refresh: true });
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'upcoming': return 'time';
      case 'active': return 'radio';
      case 'completed': return 'checkmark-circle';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'warning';
      case 'active': return 'success';
      case 'completed': return 'medium';
      default: return 'medium';
    }
  }

  getSessionTypeIcon(type: string): string {
    switch (type) {
      case 'service': return 'people-outline';
      case 'meeting': return 'business-outline';
      case 'sessions': return 'calendar-outline';
      case 'class': return 'school-outline';
      default: return 'calendar-outline';
    }
  }

  trackByRecordId(index: number, record: AttendanceRecord): string {
    return record.id;
  }

  // Type-safe event handler for tab changes
  onTabChange(event: any) {
    const value = event.detail.value as string;
    this.setSelectedTab(value);
  }
}

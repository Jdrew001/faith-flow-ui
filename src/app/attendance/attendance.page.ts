import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AttendanceService } from './services/attendance.service';
import { Session, AttendanceSummary } from './models/attendance.model';
import { SessionDetailModalComponent } from './components/session-detail-modal/session-detail-modal.component';
import { BulkAttendanceModalComponent } from './components/bulk-attendance-modal/bulk-attendance-modal.component';
import { SessionMembersComponent } from './components/session-members/session-members.component';
import { CreateSessionModalComponent } from './components/create-session-modal/create-session-modal.component';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss'],
  standalone: false
})
export class AttendancePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sessions: Session[] = [];
  filteredSessions: Session[] = [];
  attendanceStats: AttendanceSummary = {
    totalSessions: 0,
    attendanceRate: 0,
    totalAttendees: 0,
    averageAttendance: 0,
    weeklyGrowth: 0,
    mostPopularSession: ''
  };

  searchControl = new FormControl('');
  selectedTimeFilter = 'today';
  selectedSessionType = 'all';
  currentDate = new Date();
  isLoading = false;
  headerHidden = false;

  constructor(
    private attendanceService: AttendanceService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
    this.setupSearchFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilter() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filterSessions();
      });
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.sessions = await this.attendanceService.getSessions();
      this.attendanceStats = await this.attendanceService.getAttendanceStats();
      this.filterSessions();
    } catch (error) {
      console.error('Error loading attendance data:', error);
      await this.showToast('Error loading data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  filterSessions() {
    let filtered = [...this.sessions];

    // Filter by search term
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm) ||
        session.location.toLowerCase().includes(searchTerm) ||
        session.type.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by time period
    const now = new Date();
    switch (this.selectedTimeFilter) {
      case 'today':
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate.toDateString() === this.currentDate.toDateString();
        });
        break;
      case 'week':
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        break;
      case 'month':
        const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= monthStart && sessionDate <= monthEnd;
        });
        break;
    }

    // Filter by session type
    if (this.selectedSessionType !== 'all') {
      filtered = filtered.filter(session => session.type === this.selectedSessionType);
    }

    this.filteredSessions = filtered;
  }

  // Event handlers
  onTimeFilterChange(event: any) {
    this.selectedTimeFilter = event.detail.value;
    this.filterSessions();
  }

  onSessionTypeChange(event: any) {
    this.selectedSessionType = event.detail.value;
    this.filterSessions();
  }

  // Date navigation
  navigatePrevious() {
    switch (this.selectedTimeFilter) {
      case 'today':
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
    }
    this.filterSessions();
  }

  navigateNext() {
    switch (this.selectedTimeFilter) {
      case 'today':
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
    }
    this.filterSessions();
  }

  getCurrentDateLabel(): string {
    switch (this.selectedTimeFilter) {
      case 'today':
        return this.currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return this.currentDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      default:
        return '';
    }
  }

  async refreshData() {
    await this.loadData();
    await this.showToast('Data refreshed', 'success');
  }

  async doRefresh(event: any) {
    await this.loadData();
    // Complete the refresher after data is loaded
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  clearAllFilters() {
    this.searchControl.setValue('');
    this.selectedTimeFilter = 'today';
    this.selectedSessionType = 'all';
    this.currentDate = new Date();
    this.filterSessions();
  }

  async openSessionDetail(session: Session, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const modal = await this.modalController.create({
      component: SessionDetailModalComponent,
      componentProps: {
        session: session
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.updated) {
      await this.loadData();
    }
  }

  async createNewSession(sessionType?: string) {
    const modal = await this.modalController.create({
      component: CreateSessionModalComponent,
      componentProps: {
        defaultType: sessionType || 'service' // Default to service type
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.created) {
      await this.showToast(`Session "${data.session.title}" created successfully!`, 'success');
      await this.loadData(); // Refresh the sessions list
    }
  }

  async markAttendance(session: Session, event: Event) {
    event.stopPropagation();

    const modal = await this.modalController.create({
      component: BulkAttendanceModalComponent,
      componentProps: {
        session: session
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.updated) {
      await this.loadData();
    }
  }

  // Track by functions for performance
  trackBySessionId(index: number, session: Session): string {
    return session.id;
  }
  
  onHeaderVisibilityChange(isHidden: boolean) {
    this.headerHidden = isHidden;
  }

  trackByTypeValue(index: number, type: any): string {
    return type.value;
  }

  // New methods for the revamped UI
  async openSessionMembers(session: Session) {
    // Open session members modal for detailed attendance management
    const modal = await this.modalController.create({
      component: SessionMembersComponent,
      componentProps: {
        session: session
      },
      showBackdrop: false,
      backdropDismiss: false,
      presentingElement: undefined,
      canDismiss: true,
      mode: 'ios',
      cssClass: 'session-members-fullscreen'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.updated) {
      // Update the session stats with the latest data
      if (data.stats) {
        const sessionIndex = this.sessions.findIndex(s => s.id === session.id);
        if (sessionIndex !== -1) {
          this.sessions[sessionIndex].presentCount = data.stats.present;
          this.sessions[sessionIndex].attendanceRate = data.stats.rate;
          this.sessions[sessionIndex].totalExpected = data.stats.present + data.stats.absent;
        }
      }
      await this.loadData();
    }
  }

  getSessionTypeLabel(type: string): string {
    switch (type) {
      case 'service': return 'Service';
      case 'meeting': return 'Meeting';
      case 'event': return 'Event';
      case 'class': return 'Class';
      default: return 'Session';
    }
  }

  async quickMarkAllPresent(session: Session, event: Event) {
    event.stopPropagation();
    // Mark all members as present for this session
    await this.showToast(`Marking all present for ${session.title}`, 'success');
    // TODO: Update attendance records
  }

  getSessionTypeIcon(type: string): string {
    switch (type) {
      case 'service': return 'people-outline';
      case 'meeting': return 'business-outline';
      case 'event': return 'calendar-outline';
      case 'class': return 'school-outline';
      case 'sessions': return 'calendar-clear-outline';
      default: return 'calendar-outline';
    }
  }

  async quickMarkAttendance(session: Session, event: Event) {
    event.stopPropagation();
    // Quick mark attendance functionality
    await this.showToast(`Quick marking attendance for ${session.title}`, 'primary');
  }

  async bulkEditAttendance(session: Session, event: Event) {
    event.stopPropagation();
    
    const modal = await this.modalController.create({
      component: BulkAttendanceModalComponent,
      componentProps: {
        session: session
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.updated) {
      await this.loadData();
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'upcoming': return 'primary';
      case 'completed': return 'medium';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'service': return 'people';
      case 'meeting': return 'business';
      case 'event': return 'calendar';
      case 'class': return 'school';
      default: return 'calendar-outline';
    }
  }
}

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
import { convertUTCToLocalDate } from '../shared/utils/date-timezone.util';
import { MemberService, MemberStats } from '../services/member.service';

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
  memberStats: MemberStats = {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    recentlyAdded: 0
  };

  searchControl = new FormControl('');
  selectedTimeFilter = 'today';
  currentDate = new Date();
  isLoading = false;
  headerHidden = false;

  constructor(
    private attendanceService: AttendanceService,
    private modalController: ModalController,
    private toastController: ToastController,
    private memberService: MemberService
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
      // Prepare filters for backend
      const filters = this.getBackendFilters();
      
      // Fetch filtered data from backend
      this.sessions = await this.attendanceService.getSessions(filters);
      this.attendanceStats = await this.attendanceService.getAttendanceStats();
      
      // Fetch member statistics
      try {
        this.memberStats = await this.memberService.getMemberStats();
      } catch (memberError) {
        console.error('Error loading member stats:', memberError);
        // Continue even if member stats fail
      }
      
      // Since data is already filtered by backend, just assign
      this.filteredSessions = [...this.sessions];
    } catch (error) {
      console.error('Error loading attendance data:', error);
      await this.showToast('Error loading data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }
  
  private getBackendFilters() {
    const filters: any = {};
    
    // Add date range based on selected time filter
    const { startDate, endDate } = this.getDateRange();
    if (startDate) filters.startDate = startDate.toISOString();
    if (endDate) filters.endDate = endDate.toISOString();
    
    // Add search term
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm) {
      filters.search = searchTerm;
    }
    
    return filters;
  }
  
  private getDateRange(): { startDate: Date | null; endDate: Date | null } {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    switch (this.selectedTimeFilter) {
      case 'today':
        startDate = new Date(this.currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(this.currentDate);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'week':
        startDate = new Date(this.currentDate);
        startDate.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'month':
        startDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }
    
    return { startDate, endDate };
  }

  filterSessions() {
    // Instead of client-side filtering, reload data from backend with filters
    this.loadData();
  }

  // Event handlers
  onTimeFilterChange(event: any) {
    this.selectedTimeFilter = event.detail.value;
    this.filterSessions();
  }


  // Date navigation
  navigatePrevious() {
    // Create new date to avoid mutating the original
    this.currentDate = new Date(this.currentDate);
    
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
    // Create new date to avoid mutating the original
    this.currentDate = new Date(this.currentDate);
    
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
    this.currentDate = new Date();
    this.filterSessions();
  }

  // Helper methods to format datetime from UTC to local
  getSessionDate(session: Session): Date {
    // Use startDateTime if available, otherwise fall back to date field
    if (session.startDateTime) {
      return convertUTCToLocalDate(session.startDateTime) || new Date();
    }
    return new Date(session.date);
  }

  getSessionTime(session: Session): string {
    // Use startDateTime/endDateTime if available, otherwise fall back to startTime/endTime
    if (session.startDateTime && session.endDateTime) {
      const startDate = convertUTCToLocalDate(session.startDateTime);
      const endDate = convertUTCToLocalDate(session.endDateTime);
      
      if (startDate && endDate) {
        const startTime = startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const endTime = endDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        return `${startTime} - ${endTime}`;
      }
    }
    
    // Fallback to legacy fields
    return session.startTime || '';
  }

  getSessionStartTime(session: Session): string {
    if (session.startDateTime) {
      const startDate = convertUTCToLocalDate(session.startDateTime);
      if (startDate) {
        return startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      }
    }
    return session.startTime || '';
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

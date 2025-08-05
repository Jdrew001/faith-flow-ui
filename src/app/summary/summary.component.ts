import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ViewDidEnter, NavController } from '@ionic/angular';
import { AuthService } from '../auth/services/auth.service';
import { DashboardService } from './services/dashboard.service';
import { AttendanceStats, FollowUpItem, UpcomingEvent, EngagementData, WorkflowTriggers, DashboardMetrics } from './models/dashboard.model';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: false
})
export class SummaryComponent implements ViewDidEnter {
  currentUser$: Observable<any>;
  
  attendanceStats: AttendanceStats = {
    percentage: 0,
    present: 0,
    absent: 0,
    trend: 'stable',
    rate: 0
  };

  followUpItems: FollowUpItem[] = [];

  upcomingsessions: UpcomingEvent[] = [];

  engagementTrends: EngagementData[] = [];

  workflowTriggers: WorkflowTriggers = {
    count: 0,
    lastSync: new Date().toISOString(),
    status: 'pending',
    activeWorkflows: 0,
    completedToday: 0,
    pendingActions: 0
  };

  recentActivities: any[] = [];

  dashboardMetrics: DashboardMetrics = {
    totalMembers: 0,
    growthRate: 0,
    avgAttendance: 0,
    newMembers: 0
  };

  isLoading = false;
  isLoadingAttendance = true;
  isLoadingFollowUps = true;
  isLoadingsessions = true;
  isLoadingEngagement = true;
  isLoadingWorkflows = true;
  isLoadingActivity = true;
  isLoadingMetrics = true;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router,
    private menuCtrl: MenuController,
    private navCtrl: NavController
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ionViewDidEnter() {
    // Close the menu when navigating to this page
    this.menuCtrl.close();
    
    this.loadDashboardData();
    this.loadActivityData();
  }

  private loadDashboardData() {
    // Load data individually with separate loading states
    this.loadAttendanceData();
    this.loadFollowUpData();
    this.loadsessionsData();
    this.loadEngagementData();
    this.loadWorkflowData();
    this.loadMetricsData();
  }

  private loadAttendanceData() {
    this.isLoadingAttendance = true;
    this.dashboardService.getAttendanceStats().subscribe({
      next: (data) => {
        this.attendanceStats = data;
        this.isLoadingAttendance = false;
      },
      error: (error) => {
        console.error('Error loading attendance data:', error);
        this.isLoadingAttendance = false;
      }
    });
  }

  private loadFollowUpData() {
    this.isLoadingFollowUps = true;
    this.dashboardService.getFollowUps('high', 5).subscribe({
      next: (data) => {
        this.followUpItems = data;
        this.isLoadingFollowUps = false;
      },
      error: (error) => {
        console.error('Error loading follow-up data:', error);
        this.isLoadingFollowUps = false;
      }
    });
  }

  private loadsessionsData() {
    this.isLoadingsessions = true;
    this.dashboardService.getUpcomingsessions(5).subscribe({
      next: (data) => {
        this.upcomingsessions = data;
        this.isLoadingsessions = false;
      },
      error: (error) => {
        console.error('Error loading sessions data:', error);
        this.isLoadingsessions = false;
      }
    });
  }

  private loadEngagementData() {
    this.isLoadingEngagement = true;
    this.dashboardService.getEngagementTrends(7).subscribe({
      next: (data) => {
        this.engagementTrends = data;
        this.isLoadingEngagement = false;
      },
      error: (error) => {
        console.error('Error loading engagement data:', error);
        this.isLoadingEngagement = false;
      }
    });
  }

  private loadWorkflowData() {
    this.isLoadingWorkflows = true;
    this.dashboardService.getWorkflowStats().subscribe({
      next: (data) => {
        this.workflowTriggers = data;
        this.isLoadingWorkflows = false;
      },
      error: (error) => {
        console.error('Error loading workflow data:', error);
        this.isLoadingWorkflows = false;
      }
    });
  }

  /**
   * Generate SVG path points from engagement trend data
   */
  generateEngagementPath(): string {
    if (!this.engagementTrends || this.engagementTrends.length === 0) {
      return '0,40 280,40'; // Flat line fallback
    }

    if (this.engagementTrends.length === 1) {
      // Single point - draw a horizontal line
      return `0,40 280,40`;
    }

    const width = 280;
    const height = 80;
    const padding = 10;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Find min and max values for scaling
    const values = this.engagementTrends.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // If all values are the same, draw a horizontal line
    if (valueRange === 0) {
      const y = height / 2; // Center the line
      return `${padding},${y} ${width - padding},${y}`;
    }

    // Generate points
    const points = this.engagementTrends.map((data, index) => {
      const x = padding + (index * chartWidth) / Math.max(this.engagementTrends.length - 1, 1);
      // Invert Y coordinate (SVG Y increases downward)
      const normalizedValue = (data.value - minValue) / valueRange;
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      return `${Math.round(x)},${Math.round(y)}`;
    });

    return points.join(' ');
  }

  /**
   * Get the current engagement percentage
   */
  getCurrentEngagementPercentage(): number {
    if (!this.engagementTrends || this.engagementTrends.length === 0) {
      return 0;
    }
    return this.engagementTrends[this.engagementTrends.length - 1].value;
  }

  /**
   * Get the last point coordinates for the trend circle
   */
  getLastPointCoordinates(): { x: number; y: number } {
    if (!this.engagementTrends || this.engagementTrends.length === 0) {
      return { x: 280, y: 40 };
    }

    if (this.engagementTrends.length === 1) {
      return { x: 280, y: 40 };
    }

    const width = 280;
    const height = 80;
    const padding = 10;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const values = this.engagementTrends.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    const lastData = this.engagementTrends[this.engagementTrends.length - 1];
    const x = padding + chartWidth;
    
    let y;
    if (valueRange === 0) {
      y = height / 2; // Center if all values are the same
    } else {
      const normalizedValue = (lastData.value - minValue) / valueRange;
      y = padding + chartHeight - (normalizedValue * chartHeight);
    }

    return { x: Math.round(x), y: Math.round(y) };
  }

  onViewAllFollowUps() {
    this.navCtrl.navigateForward('/followups', { queryParams: { fromSummary: 'true' } });
  }

  onGoToSessions() {
    // Navigate to attendance page
    this.navCtrl.navigateForward('/attendance');
  }

  onViewWorkflows() {
    // Navigate to workflows page
    console.log('Navigate to workflows');
  }

  onLogout() {
    this.authService.logout();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'New Member': return 'person-add';
      case 'First Time Visitor': return 'person-add';
      case 'Prayer Request': return 'heart';
      case 'Connection': return 'people';
      case 'Pastoral Care': return 'medical';
      case 'Follow-up': return 'call';
      default: return 'person';
    }
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'service': return 'home';
      case 'meeting': return 'people';
      case 'event': return 'calendar';
      case 'conference': return 'school';
      default: return 'calendar';
    }
  }

  formatDate(date: Date | string): string {
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(eventDate.getTime())) {
      return 'Invalid Date';
    }
    
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    
    return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatLastSync(date: Date | string): string {
    const now = new Date();
    const syncDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(syncDate.getTime())) {
      return 'Unknown';
    }
    
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return syncDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  refreshData() {
    this.loadDashboardData();
  }

  doRefresh(event: any) {
    this.loadDashboardData();
    // Complete the refresher after data is loaded
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }


  onGoToAttendance() {
    this.navCtrl.navigateForward('/attendance');
  }

  onViewFollowUp(item: FollowUpItem) {
    // Navigate to follow-up detail
    console.log('View follow-up:', item);
  }

  onViewReports() {
    // Navigate to reports page
    console.log('Navigate to reports');
  }

  getEventDay(date: Date | string): string {
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    return eventDate.getDate().toString();
  }

  getEventMonth(date: Date | string): string {
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    return eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  private loadMetricsData() {
    this.isLoadingMetrics = true;
    this.dashboardService.getDashboardMetrics().subscribe({
      next: (data) => {
        this.dashboardMetrics = data;
        this.isLoadingMetrics = false;
      },
      error: (error) => {
        console.error('Error loading metrics data:', error);
        this.isLoadingMetrics = false;
      }
    });
  }

  getGrowthRate(): number {
    return this.dashboardMetrics.growthRate;
  }

  getAvgAttendance(): number {
    return this.dashboardMetrics.avgAttendance;
  }

  getNewMembers(): number {
    return this.dashboardMetrics.newMembers;
  }

  getTotalMembers(): number {
    return this.dashboardMetrics.totalMembers;
  }

  refreshActivity() {
    this.loadActivityData();
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'attendance': return 'people';
      case 'followup': return 'heart';
      case 'workflow': return 'git-branch';
      default: return 'pulse';
    }
  }

  formatActivityTime(timestamp: Date | string): string {
    const now = new Date();
    const activityDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    if (isNaN(activityDate.getTime())) {
      return 'Unknown';
    }
    
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private loadActivityData() {
    this.isLoadingActivity = true;
    this.dashboardService.getRecentActivity(5).subscribe({
      next: (data) => {
        this.recentActivities = data;
        this.isLoadingActivity = false;
      },
      error: (error) => {
        console.error('Error loading activity data:', error);
        this.isLoadingActivity = false;
      }
    });
  }

}

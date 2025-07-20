import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { Observable } from 'rxjs';

interface AttendanceStats {
  percentage: number;
  present: number;
  absent: number;
  trend: 'up' | 'down' | 'stable';
}

interface FollowUpItem {
  id: number;
  name: string;
  type: 'First Time Visitor' | 'Prayer Request' | 'Connection' | 'Follow-up';
  priority: 'high' | 'medium' | 'low';
  daysAgo: number;
}

interface Event {
  id: number;
  title: string;
  date: Date;
  time: string;
  type: 'service' | 'meeting' | 'event';
}

interface EngagementData {
  week: string;
  value: number;
}

interface WorkflowTriggers {
  count: number;
  lastSync: Date;
  status: 'active' | 'pending' | 'error';
}

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: false
})
export class SummaryComponent implements OnInit {
  currentUser$: Observable<any>;
  
  attendanceStats: AttendanceStats = {
    percentage: 78,
    present: 156,
    absent: 44,
    trend: 'up'
  };

  followUpItems: FollowUpItem[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      type: 'First Time Visitor',
      priority: 'high',
      daysAgo: 2
    },
    {
      id: 2,
      name: 'Mike Chen',
      type: 'Prayer Request',
      priority: 'medium',
      daysAgo: 1
    },
    {
      id: 3,
      name: 'Lisa Martinez',
      type: 'Connection',
      priority: 'high',
      daysAgo: 3
    }
  ];

  upcomingEvents: Event[] = [
    {
      id: 1,
      title: 'Sunday Service',
      date: new Date(2024, 0, 21), // January 21, 2024
      time: '10:00 AM',
      type: 'service'
    },
    {
      id: 2,
      title: 'Prayer Meeting',
      date: new Date(2024, 0, 23), // January 23, 2024
      time: '7:00 PM',
      type: 'meeting'
    },
    {
      id: 3,
      title: 'Youth Group',
      date: new Date(2024, 0, 25), // January 25, 2024
      time: '6:30 PM',
      type: 'event'
    }
  ];

  engagementTrends: EngagementData[] = [
    { week: 'W1', value: 65 },
    { week: 'W2', value: 72 },
    { week: 'W3', value: 68 },
    { week: 'W4', value: 78 },
    { week: 'W5', value: 82 },
    { week: 'W6', value: 75 },
    { week: 'W7', value: 80 }
  ];

  workflowTriggers: WorkflowTriggers = {
    count: 12,
    lastSync: new Date(2024, 0, 19, 14, 30), // January 19, 2024 at 2:30 PM
    status: 'active'
  };

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {}

  onViewAllFollowUps() {
    // Navigate to follow-ups page
    console.log('Navigate to follow-ups');
  }

  onGoToEvents() {
    // Navigate to events page
    console.log('Navigate to events');
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
      case 'First Time Visitor': return 'person-add';
      case 'Prayer Request': return 'heart';
      case 'Connection': return 'people';
      case 'Follow-up': return 'call';
      default: return 'person';
    }
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'service': return 'home';
      case 'meeting': return 'people';
      case 'event': return 'calendar';
      default: return 'calendar';
    }
  }

  formatDate(date: Date): string {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatLastSync(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

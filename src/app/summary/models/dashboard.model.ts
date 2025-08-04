export interface AttendanceStats {
  percentage: number;
  present: number;
  absent: number;
  trend: 'up' | 'down' | 'stable';
  rate?: number;
}

export interface FollowUpItem {
  id: number;
  name: string;
  type: 'New Member' | 'First Time Visitor' | 'Prayer Request' | 'Connection' | 'Pastoral Care' | 'Follow-up';
  priority: 'high' | 'medium' | 'low';
  daysAgo: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string; // ISO 8601 date string
  time: string;
  type: 'service' | 'meeting' | 'event' | 'conference';
  location?: string;
  attendeeCount?: number;
}

export interface EngagementData {
  week: string;
  value: number;
}

export interface WorkflowTriggers {
  count: number;
  lastSync: string; // ISO 8601 date string
  status: 'active' | 'pending' | 'error';
  activeWorkflows: number;
  completedToday: number;
  pendingActions: number;
}

export interface SessionStats {
  totalToday: number;
  upcomingThisWeek: number;
  completedThisMonth: number;
}

export interface DashboardSummary {
  attendance: AttendanceStats;
  engagement: EngagementData[];
  followUps: FollowUpItem[];
  sessions: {
    stats: SessionStats;
    upcoming: UpcomingEvent[];
  };
  workflows: WorkflowTriggers;
}

export interface RecentActivity {
  id: string;
  type: 'attendance' | 'followup' | 'workflow' | 'member';
  description: string;
  timestamp: string;
  userId?: string;
  relatedId?: string;
}

export interface DashboardMetrics {
  totalMembers: number;
  growthRate: number;
  avgAttendance: number;
  newMembers: number;
}
export interface FollowupContact {
  phone?: string;
  email?: string;
}

export interface DateTimeWithTimezone {
  localTime: string;
  timezoneOffsetMinutes: number;
  utcTime?: string;
}

export interface FollowupDto {
  id?: string;
  personName: string;
  memberId?: string;  // Reference to member
  title: string;
  description?: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  createdDate?: string;
  dueDate?: string;
  notes?: string;
  contactInfo?: FollowupContact;
}

export interface CreateFollowupDto {
  personName: string;
  memberId?: string;  // Reference to member
  title: string;
  description?: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo?: string;
  dueDate?: string | DateTimeWithTimezone;  // Can be ISO string or object with timezone
  notes?: string;
  contactInfo?: FollowupContact;
}

export interface UpdateFollowupDto {
  personName?: string;
  memberId?: string;  // Reference to member
  title?: string;
  description?: string;
  type?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  dueDate?: string | DateTimeWithTimezone;  // Can be ISO string or object with timezone
  notes?: string;
  contactInfo?: FollowupContact;
}

export interface FollowupAssignment {
  followupId: string;
  assignedTo: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string | DateTimeWithTimezone;  // Can be ISO string or object with timezone
  notes?: string;
}

export interface FollowupFilters {
  status?: 'all' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'all' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignee?: string;
  search?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdDate' | 'name' | 'status';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FollowupStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  highPriority: number;
}

export interface FollowupResponse {
  followups: FollowupDto[];
  total: number;
  stats?: FollowupStats;
}
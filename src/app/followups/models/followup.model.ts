export interface FollowupContact {
  phone?: string;
  email?: string;
}

export interface FollowupDto {
  id?: string;
  personName: string;
  title: string;
  description?: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  createdDate?: string;
  dueDate?: string;
  notes?: string;
  contactInfo?: FollowupContact;
}

export interface CreateFollowupDto {
  personName: string;
  title: string;
  description?: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
  contactInfo?: FollowupContact;
}

export interface UpdateFollowupDto {
  personName?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
  contactInfo?: FollowupContact;
}

export interface FollowupAssignment {
  followupId: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  notes?: string;
}

export interface FollowupFilters {
  status?: 'all' | 'pending' | 'in-progress' | 'completed';
  priority?: 'all' | 'high' | 'medium' | 'low';
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
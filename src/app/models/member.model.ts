export interface MemberAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: MemberAddress | string; // Can be string for legacy compatibility
  status: 'ACTIVE' | 'INACTIVE' | string;
  joinDate?: string;
  lastAttendance?: string;
  groups?: string[];
  tags?: string[];
  notes?: string;
  emergencyContact?: EmergencyContact;
  pco_id?: string; // Planning Center Online ID
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateMemberDto {
  name: string;
  email: string;
  phone?: string;
  address?: MemberAddress;
  groups?: string[];
  tags?: string[];
  notes?: string;
  emergencyContact?: EmergencyContact;
}

export interface UpdateMemberDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: MemberAddress;
  status?: 'ACTIVE' | 'INACTIVE';
  groups?: string[];
  tags?: string[];
  notes?: string;
  emergencyContact?: EmergencyContact;
}

export interface MemberFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sortBy?: 'name' | 'joinDate' | 'lastAttendance';
  sortDirection?: 'asc' | 'desc';
  sortOrder?: 'ASC' | 'DESC';
}

export interface MemberStats {
  totalActive: number;
  totalInactive: number;
  newThisMonth: number;
  totalMembers?: number;
  activeMembers?: number;
  inactiveMembers?: number;
  recentlyAdded?: number;
}

export interface MembersResponse {
  members: Member[];
  total: number;
  stats?: MemberStats;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface MemberSearchOptions {
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MemberSearchResponse {
  members: Member[];
  total: number;
  query: string;
}

export interface MemberAttendance {
  sessionId: string;
  sessionTitle: string;
  date: string;
  status: 'Present' | 'Absent';
}

export interface MemberAttendanceResponse {
  attendance: MemberAttendance[];
  stats: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
}
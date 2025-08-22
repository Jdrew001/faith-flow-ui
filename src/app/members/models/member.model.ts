export interface Member {
  id: string;
  pco_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  birthdate?: string;
  anniversary?: string;
  status: MemberStatus;
  membership_date?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Computed properties for display
  age?: number;
  lastAttendance?: string;
  attendanceRate?: number;
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  VISITOR = 'VISITOR',
  ARCHIVED = 'ARCHIVED'
}

export interface MemberFilters {
  status?: MemberStatus;
  searchTerm?: string;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface CreateMemberDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  birthdate?: string;
  anniversary?: string;
  status?: MemberStatus;
  membership_date?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateMemberDto extends Partial<CreateMemberDto> {
  id: string;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  avgAttendance: number;
}

export interface MemberListResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: string;
  tags?: string[];
}
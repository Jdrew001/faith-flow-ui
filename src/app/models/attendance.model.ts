export interface Session {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  type: 'service' | 'meeting' | 'event' | 'class';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  presentCount: number;
  totalExpected: number;
  attendanceRate: number;
  description?: string;
  leader?: string;
  tags?: string[];
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  personId: string;
  personName: string;
  status: 'Present' | 'Absent';
  timestamp: string;
  notes?: string;
}

export interface AttendanceSummary {
  totalSessions: number;
  averageAttendance: number;
  totalAttendees: number;
  weeklyGrowth: number;
  mostPopularSession: string;
  attendanceRate: number;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  groups?: string[];
  lastAttendance?: string;
}

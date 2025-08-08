export interface Session {
  id: string;
  title: string;
  date: Date;
  startTime?: string;  // Legacy field
  endTime?: string;    // Legacy field
  startDateTime?: string;  // ISO 8601 UTC timestamp
  endDateTime?: string;    // ISO 8601 UTC timestamp
  location: string;
  type: 'service' | 'meeting' | 'event' | 'class' | 'sessions';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  presentCount: number;
  totalExpected: number;
  attendanceRate: number;
  description?: string;
  leader?: string;
  tags?: string[];
}

export interface DateTimeWithTimezone {
  localTime: string;
  timezoneOffsetMinutes: number;
  utcTime?: string;
}

export interface CreateSessionDto {
  title: string;
  date?: Date;  // Legacy field
  startTime?: string;  // Legacy field
  endTime?: string;  // Legacy field
  startDateTime?: string | DateTimeWithTimezone;  // Can be ISO string or object with timezone
  endDateTime?: string | DateTimeWithTimezone;    // Can be ISO string or object with timezone
  location: string;
  type?: 'service' | 'meeting' | 'event' | 'class';
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
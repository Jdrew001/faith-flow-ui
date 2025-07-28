import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;
  private sessionsSubject = new BehaviorSubject<Session[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  async getSessions(): Promise<Session[]> {
    try {
      // For now, return mock data - replace with actual API call
      const mockSessions: Session[] = [
        {
          id: '1',
          title: 'Sunday Morning Service',
          description: 'Weekly worship service with sermon and communion',
          startTime: '10:00',
          endTime: '11:30',
          date: new Date(),
          type: 'service',
          location: 'Main Sanctuary',
          presentCount: 142,
          totalExpected: 150,
          attendanceRate: 94.7,
          status: 'upcoming',
          leader: 'Pastor John',
          tags: ['worship', 'sermon', 'communion']
        },
        {
          id: '2', 
          title: 'Youth Group',
          description: 'Weekly youth gathering with games and Bible study',
          startTime: '18:00',
          endTime: '20:00',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          type: 'meeting',
          location: 'Youth Room',
          presentCount: 32,
          totalExpected: 35,
          attendanceRate: 91.4,
          status: 'upcoming',
          leader: 'Sarah Wilson',
          tags: ['youth', 'games', 'bible study']
        },
        {
          id: '3',
          title: 'Wednesday Bible Study',
          description: 'Deep dive into Scripture with discussion',
          startTime: '19:00',
          endTime: '20:30',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          type: 'class',
          location: 'Fellowship Hall',
          presentCount: 38,
          totalExpected: 45,
          attendanceRate: 84.4,
          status: 'upcoming',
          leader: 'Dr. Smith',
          tags: ['bible study', 'discussion']
        },
        {
          id: '4',
          title: 'Small Group Alpha',
          description: 'Exploring faith questions in a small group setting',
          startTime: '19:30',
          endTime: '21:00',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          type: 'meeting',
          location: 'Room 201',
          presentCount: 10,
          totalExpected: 12,
          attendanceRate: 83.3,
          status: 'upcoming',
          leader: 'Mark Johnson',
          tags: ['small group', 'faith exploration']
        },
        {
          id: '5',
          title: 'Prayer Meeting',
          description: 'Corporate prayer and intercession',
          startTime: '18:30',
          endTime: '19:30',
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          type: 'meeting',
          location: 'Prayer Room',
          presentCount: 22,
          totalExpected: 25,
          attendanceRate: 88.0,
          status: 'upcoming',
          leader: 'Mary Davis',
          tags: ['prayer', 'intercession']
        }
      ];

      this.sessionsSubject.next(mockSessions);
      return mockSessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  async getAttendanceStats(): Promise<AttendanceSummary> {
    try {
      // Mock stats - replace with actual API call
      return {
        totalSessions: 28,
        averageAttendance: 78.5,
        totalAttendees: 287,
        weeklyGrowth: 5.2,
        mostPopularSession: 'Sunday Morning Service',
        attendanceRate: 89.3
      };
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return {
        totalSessions: 0,
        averageAttendance: 0,
        totalAttendees: 0,
        weeklyGrowth: 0,
        mostPopularSession: '',
        attendanceRate: 0
      };
    }
  }

  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      // Mock attendance records - replace with actual API call
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          sessionId,
          personId: 'p1',
          personName: 'John Smith',
          status: 'Present',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          sessionId,
          personId: 'p2', 
          personName: 'Sarah Johnson',
          status: 'Present',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          sessionId,
          personId: 'p3',
          personName: 'Mike Wilson',
          status: 'Absent',
          timestamp: new Date().toISOString()
        }
      ];
      return mockRecords;
    } catch (error) {
      console.error('Error fetching session attendance:', error);
      return [];
    }
  }

  async markAttendance(sessionId: string, personId: string, status: 'Present' | 'Absent', notes?: string): Promise<AttendanceRecord> {
    try {
      const record: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        sessionId,
        personId,
        personName: 'Person Name', // This would come from person lookup
        status,
        timestamp: new Date().toISOString(),
        notes
      };

      // Here you would make an actual API call
      console.log('Marking attendance:', record);
      return record;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async bulkMarkAttendance(sessionId: string, attendanceData: { personId: string; status: 'Present' | 'Absent' }[]): Promise<AttendanceRecord[]> {
    try {
      const records: AttendanceRecord[] = attendanceData.map(data => ({
        id: Math.random().toString(36).substr(2, 9),
        sessionId,
        personId: data.personId,
        personName: 'Person Name', // This would come from person lookup
        status: data.status,
        timestamp: new Date().toISOString()
      }));

      // Here you would make an actual API call
      console.log('Bulk marking attendance:', records);
      return records;
    } catch (error) {
      console.error('Error bulk marking attendance:', error);
      throw error;
    }
  }

  async exportSessionData(sessionId: string): Promise<void> {
    try {
      // This would generate and download a CSV or Excel file
      console.log('Exporting data for session:', sessionId);
    } catch (error) {
      console.error('Error exporting session data:', error);
      throw error;
    }
  }

  async getPeople(): Promise<Person[]> {
    try {
      // Mock people data - replace with actual API call
      const mockPeople: Person[] = [
        {
          id: 'p1',
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1-555-0123',
          groups: ['Adults', 'Worship Team'],
          lastAttendance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'p2',
          name: 'Sarah Johnson', 
          email: 'sarah.j@email.com',
          phone: '+1-555-0124',
          groups: ['Women\'s Ministry', 'Small Group Leaders'],
          lastAttendance: new Date().toISOString()
        },
        {
          id: 'p3',
          name: 'Mike Wilson',
          email: 'mike.wilson@email.com',
          phone: '+1-555-0125',
          groups: ['Men\'s Ministry', 'Ushers'],
          lastAttendance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      return mockPeople;
    } catch (error) {
      console.error('Error fetching people:', error);
      return [];
    }
  }

  getSessionTrends(sessionId: string): Observable<any> {
    // This would return attendance trends data over time
    return this.http.get(`${this.apiUrl}/trends/session/${sessionId}`);
  }

  getPersonAttendance(personId: string): Observable<AttendanceRecord[]> {
    // This would return a person's attendance history
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/person/${personId}`);
  }

  async updateAttendanceRecord(sessionId: string, personId: string, status: string): Promise<void> {
    try {
      // Mock implementation - replace with actual API call
      console.log(`Updating attendance for session ${sessionId}, person ${personId}, status: ${status}`);
      // In real implementation, this would make an HTTP request to update the attendance record
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      // Mock implementation - in real app, this would make HTTP POST request
      const newSession: Session = {
        id: 'session_' + Date.now(), // Generate unique ID
        title: sessionData.title || 'New Session',
        description: sessionData.description || '',
        date: sessionData.date || new Date(),
        startTime: sessionData.startTime || '10:00',
        endTime: sessionData.endTime || '11:00',
        location: sessionData.location || '',
        type: sessionData.type || 'service',
        status: 'upcoming',
        presentCount: 0,
        totalExpected: 0,
        attendanceRate: 0,
        leader: sessionData.leader,
        tags: sessionData.tags || []
      };

      // In real implementation, this would be:
      // const response = await this.http.post<Session>(`${this.apiUrl}/sessions`, sessionData).toPromise();
      
      console.log('Creating new session:', newSession);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }
}

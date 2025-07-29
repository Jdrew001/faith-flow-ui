import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Session, AttendanceRecord, AttendanceSummary, Person } from '../models';

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
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.get<Session[]>(`${this.apiUrl}/sessions`));
      const sessions = response || [];
      
      this.sessionsSubject.next(sessions);
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Fallback to mock data if API fails
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
        }
      ];
      
      this.sessionsSubject.next(mockSessions);
      return mockSessions;
    }
  }

  async getAttendanceStats(): Promise<AttendanceSummary> {
    try {
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.get<AttendanceSummary>(`${this.apiUrl}/summary`));
      return response || {
        totalSessions: 0,
        averageAttendance: 0,
        totalAttendees: 0,
        weeklyGrowth: 0,
        mostPopularSession: '',
        attendanceRate: 0
      };
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      // Fallback to mock data
      return {
        totalSessions: 28,
        averageAttendance: 78.5,
        totalAttendees: 287,
        weeklyGrowth: 5.2,
        mostPopularSession: 'Sunday Morning Service',
        attendanceRate: 89.3
      };
    }
  }

  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.get<AttendanceRecord[]>(`${this.apiUrl}/sessions/${sessionId}/attendance`));
      return response || [];
    } catch (error) {
      console.error('Error fetching session attendance:', error);
      // Fallback to mock data
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
    }
  }

  async markAttendance(sessionId: string, personId: string, status: 'Present' | 'Absent', notes?: string): Promise<AttendanceRecord> {
    try {
      const attendanceData = {
        personId,
        status,
        notes
      };

      // Make actual API call to backend
      const response = await firstValueFrom(this.http.post<AttendanceRecord>(
        `${this.apiUrl}/sessions/${sessionId}/attendance`,
        attendanceData
      ));
      
      return response || {
        id: Math.random().toString(36).substr(2, 9),
        sessionId,
        personId,
        personName: 'Person Name',
        status,
        timestamp: new Date().toISOString(),
        notes
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async bulkMarkAttendance(sessionId: string, attendanceData: { personId: string; status: 'Present' | 'Absent' }[]): Promise<AttendanceRecord[]> {
    try {
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.post<AttendanceRecord[]>(
        `${this.apiUrl}/sessions/${sessionId}/bulk-attendance`,
        attendanceData
      ));

      return response || attendanceData.map(data => ({
        id: Math.random().toString(36).substr(2, 9),
        sessionId,
        personId: data.personId,
        personName: 'Person Name',
        status: data.status,
        timestamp: new Date().toISOString()
      }));
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
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.get<Person[]>(`${this.apiUrl}/members`));
      return response || [];
    } catch (error) {
      console.error('Error fetching people:', error);
      // Fallback to mock data
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
      // Make actual API call to backend
      await firstValueFrom(this.http.put(`${this.apiUrl}/sessions/${sessionId}/attendance/${personId}`, {
        status
      }));
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.post<Session>(`${this.apiUrl}/sessions`, sessionData));
      
      return response || {
        id: 'session_' + Date.now(),
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
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, sessionData: Partial<Session>): Promise<Session> {
    try {
      // Make actual API call to backend
      const response = await firstValueFrom(this.http.put<Session>(`${this.apiUrl}/sessions/${sessionId}`, sessionData));
      return response!;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Make actual API call to backend
      await firstValueFrom(this.http.delete(`${this.apiUrl}/sessions/${sessionId}`));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }
}

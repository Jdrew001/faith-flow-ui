import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AttendanceService } from './attendance.service';
import { environment } from '../../../environments/environment';

describe('AttendanceService - Backend Integration', () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AttendanceService]
    });

    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Session Management', () => {
    it('should get sessions from backend', async () => {
      const mockSessions = [
        {
          id: '1',
          title: 'Sunday Service',
          date: new Date(),
          startTime: '10:00',
          endTime: '11:00',
          location: 'Main Sanctuary',
          type: 'service',
          status: 'upcoming',
          presentCount: 0,
          totalExpected: 100,
          attendanceRate: 0,
          tags: []
        }
      ];

      const promise = service.getSessions();
      
      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockSessions });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Sunday Service');
    });

    it('should create session via backend', async () => {
      const sessionData = {
        title: 'New Session',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        location: 'Conference Room',
        type: 'meeting' as const,
        tags: []
      };

      const mockResponse = { ...sessionData, id: '123', status: 'upcoming' };

      const promise = service.createSession(sessionData);
      
      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(sessionData);
      req.flush({ data: mockResponse });

      const result = await promise;
      expect(result.id).toBe('123');
    });

    it('should handle session creation errors', async () => {
      const sessionData = {
        title: 'Invalid Session',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        location: 'Conference Room',
        type: 'meeting' as const,
        tags: []
      };

      const promise = service.createSession(sessionData);
      
      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      req.flush(
        { error: 'Invalid session data' },
        { status: 400, statusText: 'Bad Request' }
      );

      await expectAsync(promise).toBeRejected();
    });
  });

  describe('Attendance Operations', () => {
    it('should mark attendance via backend', async () => {
      const sessionId = '123';
      const personId = '456';
      const status = 'Present';

      const promise = service.markAttendance(sessionId, personId, status);
      
      const req = httpMock.expectOne(`${apiUrl}/sessions/${sessionId}/attendance/${personId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ status });
      req.flush({ success: true });

      await promise;
      // Should complete without throwing
    });

    it('should bulk mark attendance', async () => {
      const sessionId = '123';
      const attendanceData = [
        { personId: '1', status: 'Present' as const },
        { personId: '2', status: 'Absent' as const }
      ];

      const promise = service.bulkMarkAttendance(sessionId, attendanceData);
      
      const req = httpMock.expectOne(`${apiUrl}/sessions/${sessionId}/bulk-attendance`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ attendanceRecords: attendanceData });
      req.flush({ success: true });

      await promise;
    });

    it('should get session attendance', async () => {
      const sessionId = '123';
      const mockAttendance = [
        {
          id: '1',
          sessionId: '123',
          personId: '456',
          personName: 'John Doe',
          status: 'Present' as const,
          timestamp: new Date(),
          notes: 'Present on time'
        }
      ];

      const promise = service.getSessionAttendance(sessionId);
      
      const req = httpMock.expectOne(`${apiUrl}/sessions/${sessionId}/attendance`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockAttendance });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].personId).toBe('456');
    });
  });

  describe('Statistics & Reports', () => {
    it('should get attendance statistics', async () => {
      const mockStats = {
        totalSessions: 10,
        attendanceRate: 85,
        totalAttendees: 150,
        averageAttendance: 127,
        weeklyGrowth: 5,
        mostPopularSession: 'Sunday Service'
      };

      const promise = service.getAttendanceStats();
      
      const req = httpMock.expectOne(`${apiUrl}/reports/summary`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockStats });

      const result = await promise;
      expect(result).toEqual(mockStats);
    });

    it('should get dashboard stats with period filter', async () => {
      const period = 'month';
      const mockStats = { sessions: 20, attendance: 90 };

      const promise = service.getDashboardStats(period);
      
      const req = httpMock.expectOne(`${apiUrl}/dashboard/stats?period=${period}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);

      const result = await promise;
      expect(result).toEqual(mockStats);
    });

    it('should search attendance records', async () => {
      const searchParams = {
        query: 'John',
        sessionId: '123',
        status: 'Present' as const,
        page: 1,
        limit: 10
      };

      const mockResults = {
        records: [],
        totalCount: 0,
        page: 1,
        totalPages: 0
      };

      const promise = service.searchAttendance(searchParams);
      
      const expectedUrl = `${apiUrl}/search?query=John&sessionId=123&status=Present&page=1&limit=10`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResults);

      const result = await promise;
      expect(result).toEqual(mockResults);
    });
  });

  describe('Member Integration', () => {
    it('should get active members for attendance', async () => {
      const mockMembers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-0123',
          avatar: 'avatar.jpg',
          groups: ['Adult Ministry'],
          lastAttendance: new Date()
        }
      ];

      const promise = service.getPeople();
      
      const req = httpMock.expectOne(`${apiUrl}/members?active=true&include=basicInfo`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockMembers });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('John Doe');
    });
  });

  describe('Auto-mark Operations', () => {
    it('should auto-mark unmarked as absent', async () => {
      const sessionId = '123';
      const mockResponse = {
        markedCount: 5,
        memberIds: ['1', '2', '3', '4', '5']
      };

      const promise = service.autoMarkUnmarkedAsAbsent(sessionId);
      
      const req = httpMock.expectOne(`${apiUrl}/sessions/${sessionId}/auto-mark-absent`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ data: mockResponse });

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });
  });

  describe('CSV Export', () => {
    it('should export attendance CSV', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });

      // Mock window.URL.createObjectURL
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      spyOn(window.URL, 'revokeObjectURL');
      
      // Mock document.createElement and click
      const mockLink = jasmine.createSpyObj('a', ['click']);
      spyOn(document, 'createElement').and.returnValue(mockLink);

      const promise = service.exportAttendanceCSV(startDate, endDate);
      
      const req = httpMock.expectOne(`${apiUrl}/export/csv?startDate=2024-01-01&endDate=2024-01-31`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);

      await promise;
      
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(jasmine.any(Blob));
      expect(mockLink.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const promise = service.getSessions();
      
      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      req.error(new ErrorEvent('Network error'));

      await expectAsync(promise).toBeRejected();
    });

    it('should handle 404 errors', async () => {
      const promise = service.getSessions();
      
      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      req.flush(
        { error: 'Sessions not found' },
        { status: 404, statusText: 'Not Found' }
      );

      await expectAsync(promise).toBeRejected();
    });

    it('should handle 500 server errors', async () => {
      const promise = service.getAttendanceStats();
      
      const req = httpMock.expectOne(`${apiUrl}/reports/summary`);
      req.flush(
        { error: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      await expectAsync(promise).toBeRejected();
    });
  });
});

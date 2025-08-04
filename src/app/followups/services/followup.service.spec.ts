import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FollowupService } from './followup.service';
import { environment } from '../../../environments/environment';
import { 
  FollowupDto, 
  CreateFollowupDto, 
  UpdateFollowupDto, 
  FollowupAssignment, 
  FollowupFilters,
  FollowupStats,
  FollowupResponse 
} from '../models/followup.model';

describe('FollowupService - Backend Integration', () => {
  let service: FollowupService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/followups`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FollowupService]
    });

    service = TestBed.inject(FollowupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Core CRUD Operations', () => {
    it('should get followups with filters from backend', async () => {
      const mockResponse: FollowupResponse = {
        followups: [
          {
            id: '1',
            personName: 'John Doe',
            title: 'Welcome Visit',
            description: 'New member follow-up',
            type: 'New Member Follow-up',
            priority: 'high',
            status: 'pending',
            assignedTo: 'Pastor John',
            createdDate: '2025-08-01T10:00:00Z',
            dueDate: '2025-08-08T10:00:00Z',
            notes: 'Urgent follow-up needed',
            contactInfo: {
              phone: '(555) 123-4567',
              email: 'john@example.com'
            }
          }
        ],
        total: 1,
        stats: {
          total: 10,
          pending: 3,
          inProgress: 2,
          completed: 5,
          overdue: 1,
          highPriority: 2
        }
      };

      const filters: FollowupFilters = {
        status: 'pending',
        priority: 'high',
        limit: 10
      };

      const promise = service.getFollowups(filters);
      
      const req = httpMock.expectOne(`${apiUrl}?status=pending&priority=high&limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockResponse });

      const result = await promise;
      expect(result.followups.length).toBe(1);
      expect(result.followups[0].personName).toBe('John Doe');
      expect(result.total).toBe(1);
    });

    it('should get single followup by ID', async () => {
      const mockFollowup: FollowupDto = {
        id: '1',
        personName: 'John Doe',
        title: 'Welcome Visit',
        description: 'New member follow-up',
        type: 'New Member Follow-up',
        priority: 'high',
        status: 'pending',
        assignedTo: 'Pastor John',
        createdDate: '2025-08-01T10:00:00Z',
        dueDate: '2025-08-08T10:00:00Z'
      };

      const promise = service.getFollowup('1');
      
      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockFollowup });

      const result = await promise;
      expect(result.id).toBe('1');
      expect(result.personName).toBe('John Doe');
    });

    it('should create new followup', async () => {
      const createDto: CreateFollowupDto = {
        personName: 'Jane Smith',
        title: 'Prayer Follow-up',
        description: 'Follow up on prayer request',
        type: 'Prayer Request Follow-up',
        priority: 'medium',
        assignedTo: 'Pastor John',
        dueDate: '2025-08-15T10:00:00Z',
        notes: 'Needs pastoral care',
        contactInfo: {
          phone: '(555) 987-6543',
          email: 'jane@example.com'
        }
      };

      const mockResponse: FollowupDto = {
        id: '2',
        ...createDto,
        status: 'pending',
        createdDate: '2025-08-03T10:00:00Z'
      };

      const promise = service.createFollowup(createDto);
      
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush({ success: true, data: mockResponse });

      const result = await promise;
      expect(result.id).toBe('2');
      expect(result.personName).toBe('Jane Smith');
      expect(result.status).toBe('pending');
    });

    it('should update existing followup', async () => {
      const updateDto: UpdateFollowupDto = {
        title: 'Updated Title',
        priority: 'high',
        notes: 'Updated notes'
      };

      const mockResponse: FollowupDto = {
        id: '1',
        personName: 'John Doe',
        title: 'Updated Title',
        description: 'New member follow-up',
        type: 'New Member Follow-up',
        priority: 'high',
        status: 'pending',
        assignedTo: 'Pastor John',
        createdDate: '2025-08-01T10:00:00Z',
        dueDate: '2025-08-08T10:00:00Z',
        notes: 'Updated notes'
      };

      const promise = service.updateFollowup('1', updateDto);
      
      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush({ success: true, data: mockResponse });

      const result = await promise;
      expect(result.title).toBe('Updated Title');
      expect(result.priority).toBe('high');
      expect(result.notes).toBe('Updated notes');
    });

    it('should delete followup', async () => {
      const promise = service.deleteFollowup('1');
      
      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Followup deleted successfully' });

      await promise;
      // Should complete without throwing
    });
  });

  describe('Status Management', () => {
    it('should update followup status', async () => {
      const mockResponse: FollowupDto = {
        id: '1',
        personName: 'John Doe',
        title: 'Welcome Visit',
        description: 'New member follow-up',
        type: 'New Member Follow-up',
        priority: 'high',
        status: 'completed',
        assignedTo: 'Pastor John',
        createdDate: '2025-08-01T10:00:00Z',
        dueDate: '2025-08-08T10:00:00Z'
      };

      const promise = service.updateStatus('1', 'completed');
      
      const req = httpMock.expectOne(`${apiUrl}/1/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'completed' });
      req.flush({ success: true, data: mockResponse });

      const result = await promise;
      expect(result.status).toBe('completed');
    });

    it('should bulk update statuses', async () => {
      const ids = ['1', '2', '3'];
      const status = 'completed';

      const promise = service.bulkUpdateStatus(ids, status);
      
      const req = httpMock.expectOne(`${apiUrl}/bulk-update-status`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ ids, status });
      req.flush({ success: true, message: 'Updated 3 followups to completed' });

      await promise;
      // Should complete without throwing
    });
  });

  describe('Assignment Operations', () => {
    it('should assign followup to user', async () => {
      const assignment: FollowupAssignment = {
        followupId: '1',
        assignedTo: 'Pastor Sarah',
        priority: 'high',
        dueDate: '2025-08-15T10:00:00Z',
        notes: 'Urgent assignment'
      };

      const mockResponse: FollowupDto = {
        id: '1',
        personName: 'John Doe',
        title: 'Welcome Visit',
        description: 'New member follow-up',
        type: 'New Member Follow-up',
        priority: 'high',
        status: 'pending',
        assignedTo: 'Pastor Sarah',
        createdDate: '2025-08-01T10:00:00Z',
        dueDate: '2025-08-15T10:00:00Z',
        notes: 'Urgent assignment'
      };

      const promise = service.assignFollowup(assignment);
      
      const req = httpMock.expectOne(`${apiUrl}/1/assign`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        assignedTo: 'Pastor Sarah',
        priority: 'high',
        dueDate: '2025-08-15T10:00:00Z',
        notes: 'Urgent assignment'
      });
      req.flush({ success: true, data: mockResponse });

      const result = await promise;
      expect(result.assignedTo).toBe('Pastor Sarah');
      expect(result.priority).toBe('high');
      expect(result.notes).toBe('Urgent assignment');
    });
  });

  describe('Analytics & Reports', () => {
    it('should get followup statistics', async () => {
      const mockStats: FollowupStats = {
        total: 25,
        pending: 8,
        inProgress: 5,
        completed: 12,
        overdue: 3,
        highPriority: 6
      };

      const promise = service.getStats();
      
      const req = httpMock.expectOne(`${apiUrl}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStats });

      const result = await promise;
      expect(result.total).toBe(25);
      expect(result.pending).toBe(8);
      expect(result.overdue).toBe(3);
    });

    it('should get overdue followups', async () => {
      const mockOverdue: FollowupDto[] = [
        {
          id: '1',
          personName: 'John Doe',
          title: 'Overdue Visit',
          description: 'Past due follow-up',
          type: 'Pastoral Care',
          priority: 'high',
          status: 'pending',
          assignedTo: 'Pastor John',
          createdDate: '2025-07-20T10:00:00Z',
          dueDate: '2025-08-01T10:00:00Z'
        }
      ];

      const promise = service.getOverdueFollowups();
      
      const req = httpMock.expectOne(`${apiUrl}/overdue`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { followups: mockOverdue } });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Overdue Visit');
    });

    it('should export followups to CSV', async () => {
      const filters: FollowupFilters = {
        status: 'pending',
        priority: 'high'
      };

      // Mock DOM elements for CSV download
      const mockLink = jasmine.createSpyObj('a', ['click']);
      spyOn(document, 'createElement').and.returnValue(mockLink);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      spyOn(window.URL, 'revokeObjectURL');

      const mockResponse = {
        success: true,
        data: 'Name,Title,Type,Priority,Status\nJohn Doe,Welcome Visit,New Member,high,pending',
        filename: 'followups-export-2025-08-03.csv'
      };

      const promise = service.exportToCSV(filters);
      
      const req = httpMock.expectOne(`${apiUrl}/export?status=pending&priority=high`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      await promise;
      
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const promise = service.getFollowups();
      
      const req = httpMock.expectOne(apiUrl);
      req.error(new ErrorEvent('Network error'));

      await expectAsync(promise).toBeRejected();
    });

    it('should handle 404 errors', async () => {
      const promise = service.getFollowup('non-existent');
      
      const req = httpMock.expectOne(`${apiUrl}/non-existent`);
      req.flush(
        { error: 'Followup not found' },
        { status: 404, statusText: 'Not Found' }
      );

      await expectAsync(promise).toBeRejected();
    });

    it('should handle validation errors on create', async () => {
      const invalidDto: CreateFollowupDto = {
        personName: '', // Invalid - empty name
        title: 'Test',
        type: 'Test Type',
        priority: 'high'
      };

      const promise = service.createFollowup(invalidDto);
      
      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { error: 'Validation failed', details: ['Person name is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      await expectAsync(promise).toBeRejected();
    });

    it('should handle 500 server errors', async () => {
      const promise = service.getStats();
      
      const req = httpMock.expectOne(`${apiUrl}/stats`);
      req.flush(
        { error: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      await expectAsync(promise).toBeRejected();
    });
  });

  describe('Data Caching', () => {
    it('should update local cache on create', async () => {
      const createDto: CreateFollowupDto = {
        personName: 'Test Person',
        title: 'Test Followup',
        type: 'Test Type',
        priority: 'medium'
      };

      const mockResponse: FollowupDto = {
        id: '1',
        ...createDto,
        status: 'pending',
        createdDate: '2025-08-03T10:00:00Z'
      };

      // Initially empty
      service.followups$.subscribe(followups => {
        if (followups.length === 0) {
          expect(followups.length).toBe(0);
        } else {
          expect(followups.length).toBe(1);
          expect(followups[0].personName).toBe('Test Person');
        }
      });

      const promise = service.createFollowup(createDto);
      
      const req = httpMock.expectOne(apiUrl);
      req.flush({ success: true, data: mockResponse });

      await promise;
    });

    it('should update local cache on update', async () => {
      // First populate cache with a followup
      const initialFollowup: FollowupDto = {
        id: '1',
        personName: 'John Doe',
        title: 'Original Title',
        type: 'Test Type',
        priority: 'low',
        status: 'pending'
      };

      // Simulate initial data
      const getPromise = service.getFollowups();
      const getReq = httpMock.expectOne(apiUrl);
      getReq.flush({ 
        success: true, 
        data: { 
          followups: [initialFollowup], 
          total: 1 
        } 
      });
      await getPromise;

      // Now update
      const updateDto: UpdateFollowupDto = {
        title: 'Updated Title',
        priority: 'high'
      };

      const updatedFollowup: FollowupDto = {
        ...initialFollowup,
        title: 'Updated Title',
        priority: 'high'
      };

      const updatePromise = service.updateFollowup('1', updateDto);
      
      const updateReq = httpMock.expectOne(`${apiUrl}/1`);
      updateReq.flush({ success: true, data: updatedFollowup });

      await updatePromise;

      // Verify cache was updated
      service.followups$.subscribe(followups => {
        const updated = followups.find(f => f.id === '1');
        expect(updated?.title).toBe('Updated Title');
        expect(updated?.priority).toBe('high');
      });
    });

    it('should remove from cache on delete', async () => {
      // First populate cache
      const initialFollowups: FollowupDto[] = [
        { id: '1', personName: 'John Doe', title: 'Test 1', type: 'Test', priority: 'low', status: 'pending' },
        { id: '2', personName: 'Jane Smith', title: 'Test 2', type: 'Test', priority: 'medium', status: 'pending' }
      ];

      const getPromise = service.getFollowups();
      const getReq = httpMock.expectOne(apiUrl);
      getReq.flush({ 
        success: true, 
        data: { 
          followups: initialFollowups, 
          total: 2 
        } 
      });
      await getPromise;

      // Now delete one
      const deletePromise = service.deleteFollowup('1');
      
      const deleteReq = httpMock.expectOne(`${apiUrl}/1`);
      deleteReq.flush({ success: true, message: 'Deleted successfully' });

      await deletePromise;

      // Verify cache was updated
      service.followups$.subscribe(followups => {
        expect(followups.length).toBe(1);
        expect(followups[0].id).toBe('2');
      });
    });
  });

  describe('Query Parameter Handling', () => {
    it('should handle complex filter combinations', async () => {
      const filters: FollowupFilters = {
        status: 'pending',
        priority: 'high',
        assignee: 'Pastor John',
        search: 'urgent',
        sortBy: 'dueDate',
        sortDirection: 'asc',
        limit: 25,
        offset: 0
      };

      const promise = service.getFollowups(filters);
      
      const expectedUrl = `${apiUrl}?status=pending&priority=high&assignee=Pastor%20John&search=urgent&sortBy=dueDate&sortDirection=asc&limit=25&offset=0`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { followups: [], total: 0 } });

      await promise;
    });

    it('should skip undefined filter values', async () => {
      const filters: FollowupFilters = {
        status: 'pending',
        priority: undefined,
        assignee: 'all', // Should be skipped
        search: '',
        sortBy: 'dueDate'
      };

      const promise = service.getFollowups(filters);
      
      const req = httpMock.expectOne(`${apiUrl}?status=pending&sortBy=dueDate`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { followups: [], total: 0 } });

      await promise;
    });
  });
});

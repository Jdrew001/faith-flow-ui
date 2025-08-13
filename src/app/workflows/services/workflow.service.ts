import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Workflow, 
  WorkflowHistory, 
  WorkflowTemplate, 
  WorkflowEvent, 
  WorkflowInstance,
  WorkflowStep,
  WorkflowStatistics,
  WorkflowTrigger
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private apiUrl = `${environment.apiUrl}/faith-flow-service/workflows`;
  private workflowsSubject = new BehaviorSubject<Workflow[]>([]);
  public workflows$ = this.workflowsSubject.asObservable();
  
  private templatesSubject = new BehaviorSubject<WorkflowTemplate[]>([]);
  public templates$ = this.templatesSubject.asObservable();
  
  private instancesSubject = new BehaviorSubject<WorkflowInstance[]>([]);
  public instances$ = this.instancesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTemplates();
  }

  // Template Management
  getWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`${this.apiUrl}/templates`).pipe(
      tap(workflows => this.workflowsSubject.next(workflows)),
      catchError(error => {
        console.error('Error loading workflows:', error);
        return of([]);
      })
    );
  }

  getWorkflow(id: string): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.apiUrl}/templates/${id}`);
  }

  createWorkflow(workflow: Partial<Workflow>): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.apiUrl}/templates`, workflow).pipe(
      tap(() => this.getWorkflows().subscribe())
    );
  }

  updateWorkflow(id: string, workflow: Partial<Workflow>): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.apiUrl}/templates/${id}`, workflow).pipe(
      tap(() => this.getWorkflows().subscribe())
    );
  }

  deleteWorkflow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`).pipe(
      tap(() => this.getWorkflows().subscribe())
    );
  }

  toggleWorkflowStatus(id: string, status: 'active' | 'paused'): Observable<{ success: boolean }> {
    const endpoint = status === 'active' ? 'activate' : 'archive';
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/templates/${id}/${endpoint}`, {}).pipe(
      tap(() => this.getWorkflows().subscribe())
    );
  }

  duplicateWorkflow(id: string, name?: string): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.apiUrl}/templates/${id}/duplicate`, { name: name || 'Copy' }).pipe(
      tap(() => this.getWorkflows().subscribe())
    );
  }

  getTemplateProgress(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates/${id}/progress`);
  }

  getTemplateOverview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates/overview`);
  }

  // Workflow History & Statistics
  getWorkflowHistory(id: string): Observable<WorkflowHistory[]> {
    return this.http.get<WorkflowHistory[]>(`${this.apiUrl}/${id}/history`);
  }

  getWorkflowStatistics(workflowId: string, period: 'day' | 'week' | 'month' | 'all' = 'week'): Observable<WorkflowStatistics> {
    return this.http.get<WorkflowStatistics>(`${this.apiUrl}/${workflowId}/statistics?period=${period}`);
  }

  // Workflow Instances
  startWorkflow(templateId: string, memberId: string): Observable<WorkflowInstance> {
    return this.http.post<WorkflowInstance>(`${this.apiUrl}/start`, {
      templateId,
      memberId
    }).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }
  
  getWorkflowInstances(status?: string, limit: number = 20): Observable<WorkflowInstance[]> {
    let url = `${this.apiUrl}/instances`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    params.push(`limit=${limit}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    return this.http.get<WorkflowInstance[]>(url).pipe(
      tap(instances => this.instancesSubject.next(instances)),
      catchError(error => {
        console.error('Error loading workflow instances:', error);
        return of([]);
      })
    );
  }
  
  getWorkflowInstance(instanceId: string): Observable<WorkflowInstance> {
    return this.http.get<WorkflowInstance>(`${this.apiUrl}/${instanceId}`);
  }

  pauseWorkflow(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${id}/pause`, {}).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }

  resumeWorkflow(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${id}/resume`, {}).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }

  cancelWorkflowInstance(instanceId: string, reason?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/${instanceId}/cancel`,
      { reason }
    ).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }
  
  // Workflow Steps
  completeWorkflowStep(stepId: string, notes?: string): Observable<{ success: boolean; nextStep?: any }> {
    return this.http.post<{ success: boolean; nextStep?: any }>(
      `${this.apiUrl}/steps/${stepId}/complete`,
      { notes }
    ).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }
  
  skipWorkflowStep(stepId: string, reason: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/steps/${stepId}/skip`,
      { reason }
    ).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }

  // Assignment completion (for manual tasks)
  completeAssignment(assignmentId: string, notes?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/faith-flow-service/followups/assignments/${assignmentId}/complete`,
      { notes }
    );
  }
  
  // Triggers & Automation
  checkTriggers(): Observable<{ triggered: number; members: any[] }> {
    return this.http.post<{ triggered: number; members: any[] }>(`${this.apiUrl}/triggers/check`, {});
  }

  checkMemberTriggers(memberId: string): Observable<{ shouldTrigger: boolean; workflows: Workflow[] }> {
    return this.http.post<{ shouldTrigger: boolean; workflows: Workflow[] }>(
      `${this.apiUrl}/triggers/check/${memberId}`, 
      {}
    );
  }

  previewTriggers(days: number = 21): Observable<{ affectedMembers: any[]; patterns: any[] }> {
    return this.http.get<{ affectedMembers: any[]; patterns: any[] }>(
      `${this.apiUrl}/triggers/preview?days=${days}`
    );
  }

  getAttendancePatterns(days: number = 21, eventId?: string): Observable<any[]> {
    let url = `${this.apiUrl}/triggers/patterns?days=${days}`;
    if (eventId) url += `&eventId=${eventId}`;
    return this.http.get<any[]>(url);
  }

  getEvents(): Observable<WorkflowEvent[]> {
    return this.http.get<WorkflowEvent[]>(`${environment.apiUrl}/events`).pipe(
      catchError(error => {
        console.error('Error loading events:', error);
        return of(this.getMockEvents());
      })
    );
  }

  private loadTemplates(): void {
    const templates: WorkflowTemplate[] = [
      {
        id: '1',
        name: 'First-time Visitor Follow-up',
        description: 'Welcome and connect with new visitors within 24 hours',
        icon: 'person-add-outline',
        preset: {
          name: 'First-time Visitor Follow-up',
          triggerType: 'attendance',
          trigger: {
            type: 'attendance',
            attendanceType: 'first_time',
            frequency: 1,
            timeWindowDays: 7
          },
          steps: [
            {
              id: '1',
              type: 'task',
              name: 'Send Welcome Message',
              order: 1,
              config: {
                title: 'Welcome new visitor',
                description: 'Send a personalized welcome message and invite to next steps class',
                assignmentStrategy: 'role',
                roleId: 'guest-team',
                dueDateOffset: { value: 24, unit: 'hours' }
              } as any
            },
            {
              id: '2',
              type: 'wait',
              name: 'Wait 3 days',
              order: 2,
              config: {
                duration: { value: 3, unit: 'days' }
              } as any
            },
            {
              id: '3',
              type: 'email',
              name: 'Follow-up Email',
              order: 3,
              config: {
                subject: 'Great to meet you!',
                body: 'We loved having you visit us last Sunday...',
                recipientType: 'member'
              } as any
            }
          ]
        }
      },
      {
        id: '2',
        name: 'Absence Check-in',
        description: 'Reach out when someone misses 3 weeks',
        icon: 'calendar-outline',
        preset: {
          name: 'Absence Check-in',
          triggerType: 'attendance',
          trigger: {
            type: 'attendance',
            attendanceType: 'missed',
            frequency: 3,
            timeWindowDays: 21
          },
          steps: [
            {
              id: '1',
              type: 'task',
              name: 'Pastoral Check-in',
              order: 1,
              config: {
                title: 'Check in with member',
                description: 'Reach out to see if everything is okay and if they need support',
                assignmentStrategy: 'role',
                roleId: 'pastoral-care',
                dueDateOffset: { value: 48, unit: 'hours' }
              } as any
            },
            {
              id: '2',
              type: 'note',
              name: 'Log Contact',
              order: 2,
              config: {
                content: 'Member has been absent for 3+ weeks. Follow-up initiated.',
                attachToMember: true
              } as any
            }
          ]
        }
      },
      {
        id: '3',
        name: 'New Member Onboarding',
        description: 'Guide new members through their first 30 days',
        icon: 'rocket-outline',
        preset: {
          name: 'New Member Onboarding',
          triggerType: 'manual',
          trigger: {
            type: 'manual'
          },
          steps: [
            {
              id: '1',
              type: 'email',
              name: 'Welcome Email',
              order: 1,
              config: {
                subject: 'Welcome to our church family!',
                body: 'We are so excited you have decided to make our church your home...',
                recipientType: 'member'
              } as any
            },
            {
              id: '2',
              type: 'task',
              name: 'Schedule Next Steps Class',
              order: 2,
              config: {
                title: 'Enroll in Next Steps',
                description: 'Contact member to schedule them for the next Next Steps class',
                assignmentStrategy: 'specific',
                assigneeId: 'admin',
                dueDateOffset: { value: 3, unit: 'days' }
              } as any
            },
            {
              id: '3',
              type: 'wait',
              name: 'Wait 1 week',
              order: 3,
              config: {
                duration: { value: 7, unit: 'days' }
              } as any
            },
            {
              id: '4',
              type: 'task',
              name: 'Connect with Small Group',
              order: 4,
              config: {
                title: 'Small group connection',
                description: 'Help member find and connect with an appropriate small group',
                assignmentStrategy: 'role',
                roleId: 'groups-team',
                dueDateOffset: { value: 48, unit: 'hours' }
              } as any
            }
          ]
        }
      },
      {
        id: '4',
        name: 'Birthday Greetings',
        description: 'Send birthday wishes to members',
        icon: 'gift-outline',
        preset: {
          name: 'Birthday Greetings',
          triggerType: 'schedule',
          trigger: {
            type: 'schedule'
          },
          steps: [
            {
              id: '1',
              type: 'sms',
              name: 'Birthday Text',
              order: 1,
              config: {
                message: 'Happy Birthday! We are praying for a blessed year ahead!',
                recipientType: 'member'
              } as any
            }
          ]
        }
      }
    ];
    this.templatesSubject.next(templates);
  }

  private getMockEvents(): WorkflowEvent[] {
    return [
      { id: '1', name: 'Sunday Service', type: 'service' },
      { id: '2', name: 'Wednesday Bible Study', type: 'study' },
      { id: '3', name: 'Youth Group', type: 'youth' },
      { id: '4', name: 'Small Groups', type: 'groups' },
      { id: '5', name: 'Prayer Meeting', type: 'prayer' }
    ];
  }

  generateTriggerDescription(trigger: any): string {
    const typeText = trigger.attendanceType === 'missed' ? 'has missed' : 
                     trigger.attendanceType === 'attended' ? 'has attended' : 
                     'is a first-time visitor at';
    const frequencyText = trigger.frequency === 1 ? 'once' : `${trigger.frequency} times`;
    const windowText = `in the past ${trigger.timeWindowDays} days`;
    
    return `Trigger when someone ${typeText} ${frequencyText} ${windowText}`;
  }
}
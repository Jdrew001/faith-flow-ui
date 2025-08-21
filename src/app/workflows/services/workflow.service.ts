import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Workflow, 
  WorkflowHistory, 
  WorkflowTemplate, 
  WorkflowSession,
  WorkflowEvent, 
  WorkflowInstance,
  WorkflowStep,
  WorkflowStatistics,
  WorkflowTrigger,
  WorkflowTemplatePreset,
  WorkflowCategory,
  WorkflowTriggerType
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private apiUrl = environment.apiUrl;
  private workflowsSubject = new BehaviorSubject<Workflow[]>([]);
  public workflows$ = this.workflowsSubject.asObservable();
  
  private templatesSubject = new BehaviorSubject<WorkflowTemplatePreset[]>([]);
  public templates$ = this.templatesSubject.asObservable();
  
  private instancesSubject = new BehaviorSubject<WorkflowInstance[]>([]);
  public instances$ = this.instancesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTemplates();
  }

  private mapWorkflowData(workflow: any): Workflow {
    // Map the nested structure to convenience properties
    const mapped = {
      ...workflow,
      trigger: workflow.definition?.trigger || workflow.trigger,
      triggerType: workflow.definition?.trigger?.type || workflow.triggerType,
      steps: workflow.definition?.steps || workflow.steps,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at
    };
    
    console.log('Mapping workflow data:', {
      original: workflow,
      mapped: mapped,
      trigger: mapped.trigger,
      triggerType: mapped.triggerType
    });
    
    return mapped;
  }

  private prepareWorkflowPayload(workflow: Partial<Workflow>): any {
    // Prepare the payload structure expected by the API
    const payload: any = {
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      definition: {
        name: workflow.name,
        trigger: workflow.trigger,
        steps: workflow.steps
      }
    };
    
    // Remove convenience properties that shouldn't be sent to API
    delete payload.triggerType;
    delete payload.testMode;
    delete payload.createdAt;
    delete payload.updatedAt;
    
    return payload;
  }

  // Template Management
  getWorkflows(filters?: {
    category?: WorkflowCategory;
    enabled?: boolean;
    trigger_type?: WorkflowTriggerType;
  }, page: number = 1, limit: number = 20): Observable<Workflow[]> {
    let url = `${this.apiUrl}/workflow-templates?page=${page}&limit=${limit}`;
    if (filters) {
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.enabled !== undefined) url += `&enabled=${filters.enabled}`;
      if (filters.trigger_type) url += `&trigger_type=${filters.trigger_type}`;
    }
    return this.http.get<{templates: Workflow[], pagination: any}>(url).pipe(
      map(response => response.templates.map(w => this.mapWorkflowData(w))),
      tap(workflows => this.workflowsSubject.next(workflows)),
      catchError(error => {
        console.error('Error loading workflows:', error);
        return of([]);
      })
    );
  }

  getWorkflow(id: string): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.apiUrl}/workflow-templates/${id}`).pipe(
      map(workflow => this.mapWorkflowData(workflow))
    );
  }

  createWorkflow(workflow: Partial<Workflow>): Observable<Workflow> {
    const payload = {
      name: workflow.name,
      description: workflow.description,
      definition: {
        name: workflow.name,
        trigger: workflow.trigger,
        steps: workflow.steps || []
      },
      status: 'ACTIVE',
      enabled: workflow.enabled !== false
    };
    return this.http.post<Workflow>(`${this.apiUrl}/workflow-templates`, payload).pipe(
      map(response => this.mapWorkflowData(response)),
      tap(() => this.getWorkflows().subscribe())
    );
  }

  updateWorkflow(id: string, workflow: Partial<Workflow>): Observable<Workflow> {
    const payload: any = {
      name: workflow.name,
      description: workflow.description
    };
    
    // Only include definition if steps or trigger are being updated
    if (workflow.steps || workflow.trigger) {
      payload.definition = {
        name: workflow.name,
        trigger: workflow.trigger,
        steps: workflow.steps || []
      };
    }
    
    if (workflow.enabled !== undefined) {
      payload.status = workflow.enabled ? 'ACTIVE' : 'DRAFT';
    }
    
    return this.http.put<Workflow>(`${this.apiUrl}/workflow-templates/${id}`, payload).pipe(
      map(response => this.mapWorkflowData(response)),
      tap(() => this.getWorkflows().subscribe())
    );
  }

  deleteWorkflow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workflow-templates/${id}`).pipe(
      tap(() => this.getWorkflows().subscribe())
    );
  }

  toggleWorkflowStatus(id: string, status: 'ACTIVE' | 'PAUSED'): Observable<{ success: boolean }> {
    return this.updateWorkflow(id, { enabled: status === 'ACTIVE' }).pipe(
      map(() => ({ success: true }))
    );
  }

  duplicateWorkflow(id: string, name?: string): Observable<Workflow> {
    // Get the original workflow and create a copy
    return this.getWorkflow(id).pipe(
      switchMap(original => {
        const copy: Partial<Workflow> = {
          name: name || `${original.name} (Copy)`,
          description: original.description,
          category: original.category,
          trigger: original.trigger,
          steps: original.steps,
          enabled: original.enabled
        };
        return this.createWorkflow(copy);
      })
    );
  }

  getTemplateProgress(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/workflow-templates/${id}/progress`);
  }

  getTemplateOverview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/workflow-templates/overview`);
  }

  // Workflow History & Statistics
  getWorkflowHistory(id: string): Observable<WorkflowHistory[]> {
    return this.http.get<WorkflowHistory[]>(`${this.apiUrl}/workflows/${id}/history`);
  }

  getWorkflowStatistics(workflowId: string, period: 'day' | 'week' | 'month' | 'all' = 'week'): Observable<WorkflowStatistics> {
    return this.http.get<WorkflowStatistics>(`${this.apiUrl}/workflows/${workflowId}/statistics?period=${period}`);
  }

  // Workflow Instances
  startWorkflow(templateId: string, memberId: string, context?: any): Observable<WorkflowInstance> {
    return this.http.post<WorkflowInstance>(`${this.apiUrl}/workflows/start`, {
      template_id: templateId,
      member_id: memberId,
      trigger_source: 'MANUAL',
      context: context
    }).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }
  
  getWorkflowInstances(status?: string, limit: number = 20): Observable<WorkflowInstance[]> {
    let url = `${this.apiUrl}/workflows`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    params.push(`limit=${limit}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    return this.http.get<{workflows: WorkflowInstance[], total: number}>(url).pipe(
      map(response => response.workflows),
      tap(instances => this.instancesSubject.next(instances)),
      catchError(error => {
        console.error('Error loading workflow instances:', error);
        return of([]);
      })
    );
  }
  
  getWorkflowInstance(instanceId: string): Observable<WorkflowInstance> {
    return this.http.get<WorkflowInstance>(`${this.apiUrl}/workflows/${instanceId}`);
  }

  pauseWorkflow(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/workflows/${id}/pause`, {}).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }

  resumeWorkflow(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/workflows/${id}/resume`, {}).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }

  cancelWorkflowInstance(instanceId: string, reason?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/workflows/${instanceId}/cancel`,
      { reason: reason || 'Cancelled by user' }
    ).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }
  
  // Workflow Steps
  completeWorkflowStep(workflowId: string, stepId: string, data?: any): Observable<{ success: boolean; nextStep?: any }> {
    return this.http.post<{ success: boolean; nextStep?: any }>(
      `${this.apiUrl}/workflows/complete-step`,
      { 
        workflow_id: workflowId,
        step_id: stepId,
        completion_notes: data?.notes,
        data_collected: data?.dataCollected,
        completed_by: data?.completedBy
      }
    ).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }
  
  skipWorkflowStep(stepId: string, reason: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/workflows/steps/${stepId}/skip`,
      { reason }
    ).pipe(
      tap(() => this.getWorkflowInstances().subscribe())
    );
  }

  // Bulk workflow operations
  startBulkWorkflows(templateId: string, memberIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/workflows/bulk-start`, {
      template_id: templateId,
      member_ids: memberIds,
      trigger_source: 'MANUAL'
    });
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

  getSessions(): Observable<WorkflowSession[]> {
    return this.http.get<WorkflowSession[]>(`${environment.apiUrl}/sessions`).pipe(
      catchError(error => {
        console.error('Error loading sessions:', error);
        return of([]); // Return empty array on error, no mocks
      })
    );
  }

  // Deprecated - use getSessions instead
  getEvents(): Observable<WorkflowEvent[]> {
    return this.getSessions();
  }

  validateWorkflow(workflow: Partial<Workflow>): Observable<{ valid: boolean; errors?: string[] }> {
    return this.http.post<{ valid: boolean; errors?: string[] }>(
      `${this.apiUrl}/workflow-templates/validate`,
      workflow
    );
  }
  
  testWorkflow(workflow: Workflow): Observable<{ affectedMembers: number; previewData: any }> {
    return this.http.post<{ affectedMembers: number; previewData: any }>(
      `${this.apiUrl}/workflow-templates/${workflow.id}/test`,
      { memberId: null } // Will need to be provided by user
    );
  }

  private loadTemplates(): void {
    const templates: WorkflowTemplatePreset[] = [
      {
        id: '1',
        name: 'First-time Visitor Follow-up',
        description: 'Welcome and connect with new visitors within 24 hours',
        icon: 'person-add-outline',
        preset: {
          name: 'First-time Visitor Follow-up',
          description: 'Welcome and connect with new visitors within 24 hours',
          category: 'ENGAGEMENT',
          enabled: true,
          trigger: {
            type: 'first_time_visitor',
            enabled: true
          },
          steps: [
            {
              order: 1,
              type: 'manual_task',
              name: 'Send Welcome Message',
              metadata: {
                title: 'Welcome new visitor',
                description: 'Send a personalized welcome message and invite to next steps class',
                assignment_strategy: 'ROLE',
                assigned_to: 'guest-team',
                due_offset_hours: 24,
                category: 'FOLLOW_UP',
                priority: 'HIGH'
              }
            },
            {
              order: 2,
              type: 'wait',
              name: 'Wait 3 days',
              metadata: {
                duration_days: 3
              }
            },
            {
              order: 3,
              type: 'send_email',
              name: 'Follow-up Email',
              metadata: {
                to: '{{member.email}}',
                subject: 'Great to meet you!',
                body: 'We loved having you visit us last Sunday...'
              }
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
          description: 'Reach out when someone misses 3 weeks',
          category: 'PASTORAL_CARE',
          enabled: true,
          trigger: {
            type: 'attendance_rule',
            enabled: true,
            conditions: {
              absences_in_period: {
                count: 3,
                period_days: 21
              }
            }
          },
          steps: [
            {
              order: 1,
              type: 'manual_task',
              name: 'Pastoral Check-in',
              metadata: {
                title: 'Check in with member',
                description: 'Reach out to see if everything is okay and if they need support',
                assignment_strategy: 'ROLE',
                assigned_to: 'pastoral-care',
                due_offset_hours: 48,
                category: 'PASTORAL_CARE',
                priority: 'HIGH'
              }
            },
            {
              order: 2,
              type: 'create_note',
              name: 'Log Contact',
              metadata: {
                note: 'Member has been absent for 3+ weeks. Follow-up initiated.',
                category: 'PASTORAL_CARE',
                visibility: 'STAFF_ONLY'
              }
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
          description: 'Guide new members through their first 30 days',
          category: 'ONBOARDING',
          enabled: true,
          trigger: {
            type: 'manual',
            enabled: true
          },
          steps: [
            {
              order: 1,
              type: 'send_email',
              name: 'Welcome Email',
              metadata: {
                to: '{{member.email}}',
                subject: 'Welcome to our church family!',
                body: 'We are so excited you have decided to make our church your home...'
              }
            },
            {
              order: 2,
              type: 'manual_task',
              name: 'Schedule Next Steps Class',
              metadata: {
                title: 'Enroll in Next Steps',
                description: 'Contact member to schedule them for the next Next Steps class',
                assignment_strategy: 'SPECIFIC_USER',
                assigned_to: 'admin',
                due_offset_hours: 72,
                category: 'FOLLOW_UP',
                priority: 'MEDIUM'
              }
            },
            {
              order: 3,
              type: 'wait',
              name: 'Wait 1 week',
              metadata: {
                duration_days: 7
              }
            },
            {
              order: 4,
              type: 'manual_task',
              name: 'Connect with Small Group',
              metadata: {
                title: 'Small group connection',
                description: 'Help member find and connect with an appropriate small group',
                assignment_strategy: 'ROLE',
                assigned_to: 'groups-team',
                due_offset_hours: 48,
                category: 'ENGAGEMENT',
                priority: 'MEDIUM'
              }
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
          description: 'Send birthday wishes to members',
          category: 'ENGAGEMENT',
          enabled: true,
          trigger: {
            type: 'scheduled',
            enabled: true,
            schedule: '0 9 * * *' // Daily at 9 AM
          },
          steps: [
            {
              order: 1,
              type: 'send_sms',
              name: 'Birthday Text',
              metadata: {
                to: '{{member.phone}}',
                message: 'Happy Birthday {{member.first_name}}! We are praying for a blessed year ahead!'
              }
            }
          ]
        }
      }
    ];
    this.templatesSubject.next(templates);
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
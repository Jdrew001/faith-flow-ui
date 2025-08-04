import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Assignee {
  value: string;
  label: string;
  role?: string;
  avatar?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
  email?: string;
  phone?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AssigneeService {
  private apiUrl = `${environment.apiUrl}/assignees`;
  private assigneesSubject = new BehaviorSubject<Assignee[]>([]);
  public assignees$ = this.assigneesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load assignees on service initialization
    this.loadAssignees();
  }

  /**
   * Get all assignees
   */
  async getAssignees(): Promise<Assignee[]> {
    try {
      const assignees = await firstValueFrom(
        this.http.get<Assignee[]>(this.apiUrl)
      );
      
      this.assigneesSubject.next(assignees);
      return assignees;
    } catch (error) {
      console.error('Error fetching assignees:', error);
      // Return mock data as fallback
      const mockAssignees = this.getMockAssignees();
      this.assigneesSubject.next(mockAssignees);
      return mockAssignees;
    }
  }

  /**
   * Get assignees as observable for reactive updates
   */
  getAssigneesObservable(): Observable<Assignee[]> {
    return this.assignees$;
  }

  /**
   * Get a single assignee by value/id
   */
  getAssignee(value: string): Assignee | undefined {
    const assignees = this.assigneesSubject.value;
    return assignees.find(a => a.value === value);
  }

  /**
   * Get assignees by role
   */
  getAssigneesByRole(role: string): Assignee[] {
    const assignees = this.assigneesSubject.value;
    return assignees.filter(a => a.role === role);
  }

  /**
   * Get active assignees only
   */
  getActiveAssignees(): Assignee[] {
    const assignees = this.assigneesSubject.value;
    return assignees.filter(a => a.isActive !== false);
  }

  /**
   * Load assignees on initialization
   */
  private async loadAssignees(): Promise<void> {
    try {
      await this.getAssignees();
    } catch (error) {
      console.error('Error loading initial assignees:', error);
    }
  }

  /**
   * Get initials from assignee name
   */
  getAssigneeInitials(assignee: Assignee): string {
    if (assignee.avatar && assignee.avatar.length <= 3) {
      return assignee.avatar;
    }
    
    const parts = assignee.label.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return assignee.label.charAt(0);
  }

  /**
   * Get assignee color class
   */
  getAssigneeColorClass(assignee: Assignee): string {
    return `ion-color-${assignee.color || 'primary'}`;
  }

  /**
   * Mock data fallback
   */
  private getMockAssignees(): Assignee[] {
    return [
      { 
        value: 'Pastor John', 
        label: 'Pastor John', 
        role: 'Lead Pastor', 
        avatar: 'PJ', 
        color: 'primary',
        email: 'pastor.john@church.com',
        phone: '(555) 111-2222',
        isActive: true
      },
      { 
        value: 'Sarah Wilson', 
        label: 'Sarah Wilson', 
        role: 'Care Pastor', 
        avatar: 'SW', 
        color: 'secondary',
        email: 'sarah.wilson@church.com',
        phone: '(555) 111-3333',
        isActive: true
      },
      { 
        value: 'Mike Johnson', 
        label: 'Mike Johnson', 
        role: 'Youth Pastor', 
        avatar: 'MJ', 
        color: 'tertiary',
        email: 'mike.johnson@church.com',
        phone: '(555) 111-4444',
        isActive: true
      },
      { 
        value: 'Lisa Chen', 
        label: 'Lisa Chen', 
        role: 'Admin', 
        avatar: 'LC', 
        color: 'success',
        email: 'lisa.chen@church.com',
        phone: '(555) 111-5555',
        isActive: true
      },
      { 
        value: 'David Brown', 
        label: 'David Brown', 
        role: 'Volunteer Coordinator', 
        avatar: 'DB', 
        color: 'warning',
        email: 'david.brown@church.com',
        phone: '(555) 111-6666',
        isActive: true
      },
      { 
        value: 'Rachel Green', 
        label: 'Rachel Green', 
        role: 'Worship Leader', 
        avatar: 'RG', 
        color: 'danger',
        email: 'rachel.green@church.com',
        phone: '(555) 111-7777',
        isActive: true
      },
      { 
        value: 'Tom Anderson', 
        label: 'Tom Anderson', 
        role: 'Small Groups Pastor', 
        avatar: 'TA', 
        color: 'primary',
        email: 'tom.anderson@church.com',
        phone: '(555) 111-8888',
        isActive: true
      }
    ];
  }
}
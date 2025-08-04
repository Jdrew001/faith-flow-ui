import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class FollowupService {
  private apiUrl = `${environment.apiUrl}/followups`;
  private followupsSubject = new BehaviorSubject<FollowupDto[]>([]);
  public followups$ = this.followupsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all followups with optional filters
   */
  async getFollowups(filters?: FollowupFilters): Promise<FollowupResponse> {
    try {
      let params = new HttpParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            params = params.append(key, value.toString());
          }
        });
      }

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: FollowupResponse }>(`${this.apiUrl}`, { params })
      );

      const followupData = response.data;
      this.followupsSubject.next(followupData.followups);
      return followupData;
    } catch (error) {
      console.error('Error fetching followups:', error);
      throw error;
    }
  }

  /**
   * Get a single followup by ID
   */
  async getFollowup(id: string): Promise<FollowupDto> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: FollowupDto }>(`${this.apiUrl}/${id}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching followup:', error);
      throw error;
    }
  }

  /**
   * Create a new followup
   */
  async createFollowup(followup: CreateFollowupDto): Promise<FollowupDto> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: FollowupDto }>(`${this.apiUrl}`, followup)
      );
      
      // Update local cache
      const current = this.followupsSubject.value;
      this.followupsSubject.next([...current, response.data]);
      
      return response.data;
    } catch (error) {
      console.error('Error creating followup:', error);
      throw error;
    }
  }

  /**
   * Update an existing followup
   */
  async updateFollowup(id: string, updates: UpdateFollowupDto): Promise<FollowupDto> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: FollowupDto }>(`${this.apiUrl}/${id}`, updates)
      );
      
      // Update local cache
      const current = this.followupsSubject.value;
      const index = current.findIndex(f => f.id === id);
      if (index > -1) {
        current[index] = response.data;
        this.followupsSubject.next([...current]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating followup:', error);
      throw error;
    }
  }

  /**
   * Delete a followup
   */
  async deleteFollowup(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`)
      );
      
      // Update local cache
      const current = this.followupsSubject.value;
      this.followupsSubject.next(current.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting followup:', error);
      throw error;
    }
  }

  /**
   * Update followup status
   */
  async updateStatus(id: string, status: 'pending' | 'in-progress' | 'completed'): Promise<FollowupDto> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: FollowupDto }>(`${this.apiUrl}/${id}/status`, { status })
      );
      
      // Update local cache
      const current = this.followupsSubject.value;
      const index = current.findIndex(f => f.id === id);
      if (index > -1) {
        current[index] = response.data;
        this.followupsSubject.next([...current]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  /**
   * Assign a followup to a user
   */
  async assignFollowup(assignment: FollowupAssignment): Promise<FollowupDto> {
    try {
      const { followupId, ...assignmentData } = assignment;
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: FollowupDto }>(`${this.apiUrl}/${followupId}/assign`, assignmentData)
      );
      
      // Update local cache
      const current = this.followupsSubject.value;
      const index = current.findIndex(f => f.id === followupId);
      if (index > -1) {
        current[index] = response.data;
        this.followupsSubject.next([...current]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error assigning followup:', error);
      throw error;
    }
  }

  /**
   * Bulk update followup statuses
   */
  async bulkUpdateStatus(ids: string[], status: 'pending' | 'in-progress' | 'completed'): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/bulk-update-status`, { ids, status })
      );
      
      // Update local cache
      const current = this.followupsSubject.value;
      current.forEach(f => {
        if (ids.includes(f.id!)) {
          f.status = status;
        }
      });
      this.followupsSubject.next([...current]);
    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw error;
    }
  }

  /**
   * Get followup statistics
   */
  async getStats(): Promise<FollowupStats> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: FollowupStats }>(`${this.apiUrl}/stats`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Get overdue followups
   */
  async getOverdueFollowups(): Promise<FollowupDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: { followups: FollowupDto[] } }>(`${this.apiUrl}/overdue`)
      );
      return response.data.followups;
    } catch (error) {
      console.error('Error fetching overdue followups:', error);
      throw error;
    }
  }

  /**
   * Export followups to CSV
   */
  async exportToCSV(filters?: FollowupFilters): Promise<void> {
    try {
      let params = new HttpParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            params = params.append(key, value.toString());
          }
        });
      }

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: string; filename: string }>(`${this.apiUrl}/export`, { params })
      );

      // Create and download the CSV file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename || `followups-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting followups:', error);
      throw error;
    }
  }

  /**
   * Save followup (create or update based on presence of ID)
   */
  async saveFollowup(followup: CreateFollowupDto & { id?: string }): Promise<FollowupDto> {
    if (followup.id) {
      // Update existing
      const { id, ...updateData } = followup;
      return this.updateFollowup(id, updateData);
    } else {
      // Create new
      return this.createFollowup(followup);
    }
  }

  /**
   * Helper methods
   */
  private isOverdue(followup: FollowupDto): boolean {
    if (!followup.dueDate || followup.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(followup.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}
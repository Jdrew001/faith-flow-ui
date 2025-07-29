import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  pco_id?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MemberSearchOptions {
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MemberResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  recentlyAdded: number;
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = `${environment.apiUrl}/members`;
  private membersSubject = new BehaviorSubject<Member[]>([]);
  public members$ = this.membersSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all members with pagination and filtering
   */
  async getMembers(options: MemberSearchOptions = {}): Promise<MemberResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.set('page', options.page.toString());
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.sort) params.set('sort', options.sort);
      if (options.sortOrder) params.set('sortOrder', options.sortOrder);
      if (options.search) params.set('search', options.search);
      if (options.status) params.set('status', options.status);

      const url = params.toString() ? `${this.apiUrl}?${params.toString()}` : this.apiUrl;
      const response = await firstValueFrom(this.http.get<MemberResponse>(url));
      
      // Update the subject with the latest members
      this.membersSubject.next(response.members);
      
      return response;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  /**
   * Search members by query
   */
  async searchMembers(query: string, options: Partial<MemberSearchOptions> = {}): Promise<{
    members: Member[];
    total: number;
    query: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.set('q', query);
      
      if (options.page) params.set('page', options.page.toString());
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.status) params.set('status', options.status);

      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/search?${params.toString()}`)
      );
      
      return response;
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(id: string): Promise<Member> {
    try {
      return await firstValueFrom(this.http.get<Member>(`${this.apiUrl}/${id}`));
    } catch (error) {
      console.error('Error fetching member by ID:', error);
      throw error;
    }
  }

  /**
   * Get member statistics
   */
  async getMemberStats(): Promise<MemberStats> {
    try {
      return await firstValueFrom(this.http.get<MemberStats>(`${this.apiUrl}/stats/summary`));
    } catch (error) {
      console.error('Error fetching member stats:', error);
      throw error;
    }
  }

  /**
   * Get active members count
   */
  async getActiveMembersCount(): Promise<{ count: number }> {
    try {
      return await firstValueFrom(this.http.get<{ count: number }>(`${this.apiUrl}/stats/active-count`));
    } catch (error) {
      console.error('Error fetching active members count:', error);
      throw error;
    }
  }

  /**
   * Create new member
   */
  async createMember(memberData: Partial<Member>): Promise<Member> {
    try {
      const newMember = await firstValueFrom(this.http.post<Member>(this.apiUrl, memberData));
      
      // Refresh the members list
      await this.refreshMembers();
      
      return newMember;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  /**
   * Update member
   */
  async updateMember(id: string, memberData: Partial<Member>): Promise<Member> {
    try {
      const updatedMember = await firstValueFrom(this.http.put<Member>(`${this.apiUrl}/${id}`, memberData));
      
      // Refresh the members list
      await this.refreshMembers();
      
      return updatedMember;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  /**
   * Delete member
   */
  async deleteMember(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
      
      // Refresh the members list
      await this.refreshMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  /**
   * Activate member
   */
  async activateMember(id: string): Promise<Member> {
    try {
      const activatedMember = await firstValueFrom(this.http.put<Member>(`${this.apiUrl}/${id}/activate`, {}));
      
      // Refresh the members list
      await this.refreshMembers();
      
      return activatedMember;
    } catch (error) {
      console.error('Error activating member:', error);
      throw error;
    }
  }

  /**
   * Deactivate member
   */
  async deactivateMember(id: string): Promise<Member> {
    try {
      const deactivatedMember = await firstValueFrom(this.http.put<Member>(`${this.apiUrl}/${id}/deactivate`, {}));
      
      // Refresh the members list
      await this.refreshMembers();
      
      return deactivatedMember;
    } catch (error) {
      console.error('Error deactivating member:', error);
      throw error;
    }
  }

  /**
   * Refresh the current members list
   */
  private async refreshMembers(): Promise<void> {
    try {
      const response = await this.getMembers({ limit: 100 }); // Get first 100 for local state
      this.membersSubject.next(response.members);
    } catch (error) {
      console.error('Error refreshing members:', error);
    }
  }

  /**
   * Get members as observable for reactive updates
   */
  getMembersObservable(): Observable<Member[]> {
    return this.members$;
  }

  /**
   * Load initial members
   */
  async loadMembers(): Promise<void> {
    await this.refreshMembers();
  }
}

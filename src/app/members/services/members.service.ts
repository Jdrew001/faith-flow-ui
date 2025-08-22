import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Member, CreateMemberDto, UpdateMemberDto, MemberFilters, MemberStats, MemberListResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private apiUrl = environment.apiUrl;
  private membersSubject = new BehaviorSubject<Member[]>([]);
  public members$ = this.membersSubject.asObservable();
  
  private selectedMemberSubject = new BehaviorSubject<Member | null>(null);
  public selectedMember$ = this.selectedMemberSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all members with optional filters
  getMembers(filters?: MemberFilters): Observable<Member[]> {
    let params = new HttpParams()
      .set('limit', '1000'); // Get all members
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.searchTerm) params = params.set('search', filters.searchTerm);
      if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
      if (filters.hasEmail !== undefined) params = params.set('hasEmail', filters.hasEmail.toString());
      if (filters.hasPhone !== undefined) params = params.set('hasPhone', filters.hasPhone.toString());
    }
    
    return this.http.get<MemberListResponse>(`${this.apiUrl}/members`, { params }).pipe(
      map(response => response.members),
      tap(members => this.membersSubject.next(members)),
      catchError(error => {
        console.error('Error fetching members:', error);
        return of([]);
      })
    );
  }

  // Get a single member by ID
  getMember(id: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/members/${id}`).pipe(
      tap(member => this.selectedMemberSubject.next(member))
    );
  }

  // Create a new member
  createMember(memberData: CreateMemberDto): Observable<Member> {
    return this.http.post<Member>(`${this.apiUrl}/members`, memberData).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Update an existing member
  updateMember(id: string, memberData: Partial<UpdateMemberDto>): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/members/${id}`, memberData).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Soft delete (archive) a member
  archiveMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/members/${id}`).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Restore an archived member
  restoreMember(id: string): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/members/${id}/restore`, {}).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Get member statistics
  getMemberStats(): Observable<MemberStats> {
    return this.http.get<MemberStats>(`${this.apiUrl}/members/stats`).pipe(
      catchError(error => {
        console.error('Error fetching member stats:', error);
        return of({
          totalMembers: 0,
          activeMembers: 0,
          newThisMonth: 0,
          avgAttendance: 0
        });
      })
    );
  }

  // Search members by name or email
  searchMembers(query: string): Observable<Member[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Member[]>(`${this.apiUrl}/members/search`, { params });
  }

  // Get member's attendance history
  getMemberAttendance(memberId: string, limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members/${memberId}/attendance?limit=${limit}`);
  }

  // Get member's follow-ups
  getMemberFollowUps(memberId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members/${memberId}/followups`);
  }

  // Get member's workflows
  getMemberWorkflows(memberId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members/${memberId}/workflows`);
  }

  // Add tag to member
  addTag(memberId: string, tag: string): Observable<Member> {
    return this.http.post<Member>(`${this.apiUrl}/members/${memberId}/tags`, { tag }).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Remove tag from member
  removeTag(memberId: string, tag: string): Observable<Member> {
    return this.http.delete<Member>(`${this.apiUrl}/members/${memberId}/tags/${tag}`).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Refresh the members list
  private refreshMembers(): void {
    this.getMembers().subscribe();
  }

  // Clear selected member
  clearSelectedMember(): void {
    this.selectedMemberSubject.next(null);
  }

  // Get member notes
  getMemberNotes(memberId: string, limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members/${memberId}/notes?limit=${limit}`);
  }

  // Add note to member
  addMemberNote(memberId: string, content: string, category?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/members/${memberId}/notes`, { content, category });
  }

  // Delete member note
  deleteMemberNote(memberId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/members/${memberId}/notes/${noteId}`);
  }

  // Get member activity log
  getMemberActivity(memberId: string, limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members/${memberId}/activity?limit=${limit}`);
  }

  // Get member statistics
  getMemberStatistics(memberId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/members/${memberId}/stats`);
  }

  // Activate member
  activateMember(memberId: string): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/members/${memberId}/activate`, {}).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Deactivate member  
  deactivateMember(memberId: string): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/members/${memberId}/deactivate`, {}).pipe(
      tap(() => this.refreshMembers())
    );
  }
}
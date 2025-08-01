import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventFilters, sessionsResponse } from '../sessions/model/event.model';

@Injectable({
  providedIn: 'root'
})
export class sessionsService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private sessionsSubject = new BehaviorSubject<Event[]>([]);
  
  sessions$ = this.sessionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get sessions with optional filters and pagination
   */
  getsessions(
    page: number = 1, 
    limit: number = 10, 
    filters?: EventFilters
  ): Observable<sessionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.dateRange) params = params.set('dateRange', filters.dateRange);
      if (filters.organizerId) params = params.set('organizerId', filters.organizerId);
      if (filters.tags && filters.tags.length > 0) {
        params = params.set('tags', filters.tags.join(','));
      }
    }

    return this.http.get<sessionsResponse>(`${this.apiUrl}/sessions`, { params });
  }

  /**
   * Get upcoming sessions
   */
  getUpcomingsessions(limit: number = 5): Observable<Event[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('status', 'upcoming');
      
    return this.http.get<Event[]>(`${this.apiUrl}/sessions/upcoming`, { params });
  }

  /**
   * Get sessions by date range
   */
  getsessionsByDateRange(startDate: string, endDate: string): Observable<Event[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
      
    return this.http.get<Event[]>(`${this.apiUrl}/sessions/date-range`, { params });
  }

  /**
   * Get sessions by specific date
   */
  getsessionsByDate(date: string): Observable<Event[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Event[]>(`${this.apiUrl}/sessions/by-date`, { params });
  }

  /**
   * Get sessions by type
   */
  getsessionsByType(type: string, limit?: number): Observable<Event[]> {
    let params = new HttpParams().set('type', type);
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get<Event[]>(`${this.apiUrl}/sessions/by-type`, { params });
  }

  /**
   * Get recurring sessions
   */
  getRecurringsessions(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/sessions/recurring`);
  }

  /**
   * Get event by ID
   */
  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/sessions/${id}`);
  }

  /**
   * Create new event
   */
  createEvent(event: Partial<Event>): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/sessions`, event);
  }

  /**
   * Update event
   */
  updateEvent(id: string, event: Partial<Event>): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/sessions/${id}`, event);
  }

  /**
   * Delete event
   */
  deleteEvent(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/sessions/${id}`);
  }

  /**
   * Duplicate event
   */
  duplicateEvent(id: string): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/sessions/${id}/duplicate`, {});
  }

  /**
   * Cancel event
   */
  cancelEvent(id: string, reason?: string): Observable<Event> {
    const body = reason ? { reason } : {};
    return this.http.patch<Event>(`${this.apiUrl}/sessions/${id}/cancel`, body);
  }

  /**
   * Search sessions by title
   */
  searchsessions(query: string): Observable<Event[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Event[]>(`${this.apiUrl}/sessions/search`, { params });
  }

  /**
   * Get event statistics
   */
  getsessionstats(): Observable<{
    totalsessions: number;
    upcomingsessions: number;
    thisWeeksessions: number;
    thisMonthsessions: number;
    recurringsessions: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/sessions/stats`);
  }

  /**
   * Register for event
   */
  registerForEvent(eventId: string, userId?: string): Observable<boolean> {
    const body = userId ? { userId } : {};
    return this.http.post<boolean>(`${this.apiUrl}/sessions/${eventId}/register`, body);
  }

  /**
   * Unregister from event
   */
  unregisterFromEvent(eventId: string, userId?: string): Observable<boolean> {
    const body = userId ? { userId } : {};
    return this.http.post<boolean>(`${this.apiUrl}/sessions/${eventId}/unregister`, body);
  }

  /**
   * Get event attendees
   */
  getEventAttendees(eventId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sessions/${eventId}/attendees`);
  }

  /**
   * Update local sessions cache
   */
  updatesessionsCache(sessions: Event[]) {
    this.sessionsSubject.next(sessions);
  }

  /**
   * Get cached sessions
   */
  getCachedsessions(): Event[] {
    return this.sessionsSubject.value;
  }

  /**
   * Refresh sessions cache
   */
  refreshsessions(filters?: EventFilters): Observable<sessionsResponse> {
    const sessionsObs = this.getsessions(1, 50, filters);
    sessionsObs.subscribe((response: any) => {
      this.updatesessionsCache(response.sessions);
    });
    return sessionsObs;
  }
}

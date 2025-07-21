import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventFilters, EventsResponse } from '../events/model/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  
  events$ = this.eventsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get events with optional filters and pagination
   */
  getEvents(
    page: number = 1, 
    limit: number = 10, 
    filters?: EventFilters
  ): Observable<EventsResponse> {
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

    return this.http.get<EventsResponse>(`${this.apiUrl}/events`, { params });
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(limit: number = 5): Observable<Event[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('status', 'upcoming');
      
    return this.http.get<Event[]>(`${this.apiUrl}/events/upcoming`, { params });
  }

  /**
   * Get events by date range
   */
  getEventsByDateRange(startDate: string, endDate: string): Observable<Event[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
      
    return this.http.get<Event[]>(`${this.apiUrl}/events/date-range`, { params });
  }

  /**
   * Get events by specific date
   */
  getEventsByDate(date: string): Observable<Event[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Event[]>(`${this.apiUrl}/events/by-date`, { params });
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string, limit?: number): Observable<Event[]> {
    let params = new HttpParams().set('type', type);
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get<Event[]>(`${this.apiUrl}/events/by-type`, { params });
  }

  /**
   * Get recurring events
   */
  getRecurringEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/recurring`);
  }

  /**
   * Get event by ID
   */
  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
  }

  /**
   * Create new event
   */
  createEvent(event: Partial<Event>): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/events`, event);
  }

  /**
   * Update event
   */
  updateEvent(id: string, event: Partial<Event>): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/events/${id}`, event);
  }

  /**
   * Delete event
   */
  deleteEvent(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/events/${id}`);
  }

  /**
   * Duplicate event
   */
  duplicateEvent(id: string): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/events/${id}/duplicate`, {});
  }

  /**
   * Cancel event
   */
  cancelEvent(id: string, reason?: string): Observable<Event> {
    const body = reason ? { reason } : {};
    return this.http.patch<Event>(`${this.apiUrl}/events/${id}/cancel`, body);
  }

  /**
   * Search events by title
   */
  searchEvents(query: string): Observable<Event[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Event[]>(`${this.apiUrl}/events/search`, { params });
  }

  /**
   * Get event statistics
   */
  getEventStats(): Observable<{
    totalEvents: number;
    upcomingEvents: number;
    thisWeekEvents: number;
    thisMonthEvents: number;
    recurringEvents: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/events/stats`);
  }

  /**
   * Register for event
   */
  registerForEvent(eventId: string, userId?: string): Observable<boolean> {
    const body = userId ? { userId } : {};
    return this.http.post<boolean>(`${this.apiUrl}/events/${eventId}/register`, body);
  }

  /**
   * Unregister from event
   */
  unregisterFromEvent(eventId: string, userId?: string): Observable<boolean> {
    const body = userId ? { userId } : {};
    return this.http.post<boolean>(`${this.apiUrl}/events/${eventId}/unregister`, body);
  }

  /**
   * Get event attendees
   */
  getEventAttendees(eventId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/events/${eventId}/attendees`);
  }

  /**
   * Update local events cache
   */
  updateEventsCache(events: Event[]) {
    this.eventsSubject.next(events);
  }

  /**
   * Get cached events
   */
  getCachedEvents(): Event[] {
    return this.eventsSubject.value;
  }

  /**
   * Refresh events cache
   */
  refreshEvents(filters?: EventFilters): Observable<EventsResponse> {
    const eventsObs = this.getEvents(1, 50, filters);
    eventsObs.subscribe((response: any) => {
      this.updateEventsCache(response.events);
    });
    return eventsObs;
  }
}

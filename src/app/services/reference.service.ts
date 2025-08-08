import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface ReferenceOption {
  value: string;
  label: string;
}

export interface ReferenceData {
  followupTypes: ReferenceOption[];
  priorities: ReferenceOption[];
  statuses: ReferenceOption[];
}

@Injectable({
  providedIn: 'root'
})
export class ReferenceService {
  private apiUrl = `${environment.apiUrl}/reference`;
  
  // Cache the reference data
  private referenceData$: Observable<ReferenceData> | null = null;
  
  private http = inject(HttpClient);

  constructor() { }

  // Get all reference data from backend
  getReferenceData(): Observable<ReferenceData> {
    if (!this.referenceData$) {
      this.referenceData$ = this.http.get<ReferenceData>(`${this.apiUrl}/followup-options`).pipe(
        map(data => this.transformReferenceData(data)),
        shareReplay(1), // Cache the result
        catchError(error => {
          console.error('Error fetching reference data:', error);
          // Return fallback data if API fails
          return of(this.getFallbackData());
        })
      );
    }
    return this.referenceData$;
  }

  // Transform backend data to ensure consistent format
  private transformReferenceData(data: any): ReferenceData {
    return {
      followupTypes: data.types || [],
      priorities: data.priorities || [],
      statuses: data.statuses || []
    };
  }

  // Get follow-up types
  getFollowupTypes(): Observable<ReferenceOption[]> {
    return this.getReferenceData().pipe(
      map(data => data.followupTypes)
    );
  }

  // Get priority options
  getPriorityOptions(): Observable<ReferenceOption[]> {
    return this.getReferenceData().pipe(
      map(data => data.priorities)
    );
  }

  // Get status options
  getStatusOptions(): Observable<ReferenceOption[]> {
    return this.getReferenceData().pipe(
      map(data => data.statuses)
    );
  }

  // Clear cache (useful when data might have changed)
  clearCache(): void {
    this.referenceData$ = null;
  }

  // Fallback data in case API is unavailable
  private getFallbackData(): ReferenceData {
    return {
      followupTypes: [
        { value: 'First Time Visitor', label: 'First Time Visitor' },
        { value: 'Prayer Request', label: 'Prayer Request' },
        { value: 'Connection', label: 'Connection' },
        { value: 'Follow-up', label: 'Follow-up' },
        { value: 'Pastoral Care', label: 'Pastoral Care' },
        { value: 'New Member', label: 'New Member' }
      ],
      priorities: [
        { value: 'HIGH', label: 'High' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'LOW', label: 'Low' }
      ],
      statuses: [
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' }
      ]
    };
  }
}
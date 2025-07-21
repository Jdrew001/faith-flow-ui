export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  type: 'service' | 'meeting' | 'event' | 'conference';
  attendeeCount?: number;
  maxAttendees?: number;
  isRecurring?: boolean;
  recurrencePattern?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizerId?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface EventFilters {
  search?: string;
  type?: string;
  status?: string;
  dateRange?: string;
  organizerId?: string;
  tags?: string[];
}
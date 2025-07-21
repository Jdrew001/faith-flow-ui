import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Event } from '../../model/event.model';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
  standalone: false
})
export class EventCardComponent {
  @Input() event!: Event;
  @Input() viewMode: 'list' | 'grid' = 'list';
  
  @Output() eventClick = new EventEmitter<Event>();
  @Output() optionsClick = new EventEmitter<Event>();
  @Output() registerClick = new EventEmitter<Event>();

  onEventClick() {
    this.eventClick.emit(this.event);
  }

  onOptionsClick(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.optionsClick.emit(this.event);
  }

  onRegisterClick(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.registerClick.emit(this.event);
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'service': return 'heart';
      case 'meeting': return 'people';
      case 'event': return 'star';
      case 'conference': return 'megaphone';
      default: return 'calendar';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'ongoing': return 'success';
      case 'completed': return 'dark';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getAttendancePercentage(): number {
    if (!this.event.maxAttendees || !this.event.attendeeCount) return 0;
    return Math.round((this.event.attendeeCount / this.event.maxAttendees) * 100);
  }
}

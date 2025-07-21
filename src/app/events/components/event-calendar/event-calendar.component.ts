import { Component, Input, OnInit } from '@angular/core';
import { Event } from '../../model/event.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: Event[];
}

@Component({
  selector: 'app-event-calendar',
  templateUrl: './event-calendar.component.html',
  styleUrls: ['./event-calendar.component.scss'],
  standalone: false
})
export class EventCalendarComponent implements OnInit {
  @Input() events: Event[] = [];

  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit() {
    this.generateCalendar();
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayEvents = this.getEventsForDate(current);
      this.calendarDays.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        events: dayEvents
      });
      current.setDate(current.getDate() + 1);
    }
  }

  getEventsForDate(date: Date): Event[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(event => event.date === dateStr);
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getEventTypeColor(type: string): string {
    switch (type) {
      case 'service': return 'primary';
      case 'meeting': return 'secondary';
      case 'event': return 'tertiary';
      case 'conference': return 'success';
      default: return 'medium';
    }
  }
}

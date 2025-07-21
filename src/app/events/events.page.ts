import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, ModalController, AlertController, ToastController, ActionSheetController, SegmentValue } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
// import { EventsService, Event } from '../services/events.service';
import { DashboardService, UpcomingEvent } from '../services/dashboard.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Event } from '../events/model/event.model';
import { AttendanceModalComponent } from './components/attendance-modal/attendance-modal.component';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  standalone: false
})
export class EventsPage implements OnInit {
  @ViewChild('filterModal') filterModal!: IonModal;
  @ViewChild('createEventModal') createEventModal!: IonModal;

  events$ = new BehaviorSubject<Event[]>([]);
  filteredEvents$!: Observable<Event[]>;
  isLoading = false;
  viewMode: 'list' | 'calendar' | 'grid' = 'list';
  
  // Filters
  searchControl = new FormControl('');
  selectedType = new FormControl('all');
  selectedStatus = new FormControl('all');
  dateRange = new FormControl('all');
  
  eventTypes = [
    { value: 'all', label: 'All Events', icon: 'calendar' },
    { value: 'service', label: 'Services', icon: 'heart' },
    { value: 'meeting', label: 'Meetings', icon: 'people' },
    { value: 'event', label: 'Special Events', icon: 'star' },
    { value: 'conference', label: 'Conferences', icon: 'megaphone' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Status', color: 'medium' },
    { value: 'upcoming', label: 'Upcoming', color: 'primary' },
    { value: 'ongoing', label: 'Ongoing', color: 'success' },
    { value: 'completed', label: 'Completed', color: 'dark' },
    { value: 'cancelled', label: 'Cancelled', color: 'danger' }
  ];

  // Sample data - replace with real API calls
  sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Sunday Morning Service',
      description: 'Join us for worship, prayer, and fellowship',
      date: '2025-07-27',
      time: '10:00',
      location: 'Main Sanctuary',
      type: 'service',
      attendeeCount: 245,
      maxAttendees: 300,
      status: 'upcoming',
      isRecurring: true,
      recurrencePattern: 'weekly',
      tags: ['worship', 'sermon', 'communion'],
      imageUrl: 'assets/images/sunday-service.jpg'
    },
    {
      id: '2',
      title: 'Youth Group Meeting',
      description: 'Bible study and games for ages 13-18',
      date: '2025-07-22',
      time: '19:00',
      location: 'Youth Hall',
      type: 'meeting',
      attendeeCount: 32,
      maxAttendees: 50,
      status: 'upcoming',
      tags: ['youth', 'bible-study', 'games'],
      imageUrl: 'assets/images/youth-group.jpg'
    },
    {
      id: '3',
      title: 'Summer Revival Conference',
      description: 'Three days of powerful worship and teaching',
      date: '2025-08-15',
      time: '18:30',
      location: 'Conference Center',
      type: 'conference',
      attendeeCount: 89,
      maxAttendees: 500,
      status: 'upcoming',
      tags: ['revival', 'teaching', 'workshop'],
      imageUrl: 'assets/images/conference.jpg'
    },
    {
      id: '4',
      title: 'Community Outreach',
      description: 'Serving meals to the homeless in downtown',
      date: '2025-07-25',
      time: '11:00',
      location: 'Downtown Park',
      type: 'event',
      attendeeCount: 28,
      status: 'upcoming',
      tags: ['outreach', 'service', 'community'],
      imageUrl: 'assets/images/outreach.jpg'
    },
    {
      id: '5',
      title: 'Prayer Meeting',
      description: 'Weekly prayer gathering for church family',
      date: '2025-07-23',
      time: '19:30',
      location: 'Prayer Room',
      type: 'meeting',
      attendeeCount: 18,
      status: 'upcoming',
      isRecurring: true,
      recurrencePattern: 'weekly',
      tags: ['prayer', 'fellowship'],
      imageUrl: 'assets/images/prayer.jpg'
    }
  ];



  constructor(
    // private eventsService: EventsService,
    private dashboardService: DashboardService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    this.setupFilters();
  }

  ngOnInit() {
    this.loadEvents();
  }

  ionViewWillEnter() {
    this.loadEvents();
  }

  private setupFilters() {
    this.filteredEvents$ = combineLatest([
      this.events$.asObservable(),
      this.searchControl.valueChanges.pipe(startWith('')),
      this.selectedType.valueChanges.pipe(startWith('all')),
      this.selectedStatus.valueChanges.pipe(startWith('all')),
      this.dateRange.valueChanges.pipe(startWith('all'))
    ]).pipe(
      map(([events, search, type, status, dateRange]) => {
        return events.filter(event => {
          // Search filter
          const searchTerm = (search || '').toLowerCase();
          const matchesSearch = !searchTerm || 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description?.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm);

          // Type filter
          const matchesType = type === 'all' || event.type === type;

          // Status filter
          const matchesStatus = status === 'all' || event.status === status;

          // Date range filter
          const eventDate = new Date(event.date);
          const today = new Date();
          const matchesDateRange = dateRange === 'all' || this.checkDateRange(eventDate, today, dateRange || 'all');

          return matchesSearch && matchesType && matchesStatus && matchesDateRange;
        });
      })
    );
  }

  private checkDateRange(eventDate: Date, today: Date, range: string): boolean {
    const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    switch (range) {
      case 'today':
        return daysDiff === 0;
      case 'week':
        return daysDiff >= 0 && daysDiff <= 7;
      case 'month':
        return daysDiff >= 0 && daysDiff <= 30;
      case 'past':
        return daysDiff < 0;
      default:
        return true;
    }
  }

  private async loadEvents() {
    this.isLoading = true;
    try {
      // TODO: Replace with actual API call
      // const events = await this.eventsService.getEvents().toPromise();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.events$.next(this.sampleEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      this.presentToast('Failed to load events', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async presentEventOptions(event: Event) {
    const actionSheet = await this.actionSheetController.create({
      header: event.title,
      buttons: [
        {
          text: 'Take Attendance',
          icon: 'people',
          handler: () => this.takeAttendance(event)
        },
        {
          text: 'View Details',
          icon: 'eye',
          handler: () => this.viewEventDetails(event)
        },
        {
          text: 'Edit Event',
          icon: 'create',
          handler: () => this.editEvent(event)
        },
        {
          text: 'Duplicate Event',
          icon: 'copy',
          handler: () => this.duplicateEvent(event)
        },
        {
          text: 'Share Event',
          icon: 'share',
          handler: () => this.shareEvent(event)
        },
        {
          text: 'Cancel Event',
          icon: 'close',
          role: 'destructive',
          handler: () => this.cancelEvent(event)
        },
        {
          text: 'Close',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async viewEventDetails(event: Event) {
    // TODO: Implement event detail modal
    console.log('View event details:', event);
  }

  async editEvent(event: Event) {
    // TODO: Implement edit event modal
    console.log('Edit event:', event);
  }

  async duplicateEvent(event: Event) {
    const alert = await this.alertController.create({
      header: 'Duplicate Event',
      message: `Create a copy of "${event.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Duplicate',
          handler: async () => {
            // TODO: Implement duplication logic
            this.presentToast('Event duplicated successfully', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  async shareEvent(event: Event) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href + '/' + event.id
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      const eventUrl = window.location.href + '/' + event.id;
      await navigator.clipboard.writeText(eventUrl);
      this.presentToast('Event link copied to clipboard', 'success');
    }
  }

  async cancelEvent(event: Event) {
    const alert = await this.alertController.create({
      header: 'Cancel Event',
      message: `Are you sure you want to cancel "${event.title}"? This action cannot be undone.`,
      buttons: [
        { text: 'Keep Event', role: 'cancel' },
        {
          text: 'Cancel Event',
          role: 'destructive',
          handler: async () => {
            // TODO: Implement cancel logic
            event.status = 'cancelled';
            this.presentToast('Event cancelled', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  async createEvent() {
    // TODO: Open create event modal
    console.log('Create new event');
  }

  async openFilters() {
    this.filterModal.present();
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.selectedType.setValue('all');
    this.selectedStatus.setValue('all');
    this.dateRange.setValue('all');
    this.filterModal.dismiss();
  }

  applyFilters() {
    this.filterModal.dismiss();
  }

  setViewMode(mode: SegmentValue | undefined) {
    if (mode && (mode === 'list' || mode === 'calendar' || mode === 'grid')) {
      this.viewMode = mode;
    }
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
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

  getAttendancePercentage(event: Event): number {
    if (!event.maxAttendees || !event.attendeeCount) return 0;
    return Math.round((event.attendeeCount / event.maxAttendees) * 100);
  }

  trackByEventId(index: number, event: Event): string {
    return event.id;
  }

  async takeAttendance(event: Event) {
    const modal = await this.modalController.create({
      component: AttendanceModalComponent,
      componentProps: {
        event: event,
        members: [] // Will be loaded from the service
      },
      presentingElement: await this.modalController.getTop()
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // Handle saved attendance data
        console.log('Attendance saved:', result.data);
        
        const attendanceData = result.data.attendanceData || result.data;
        const newGuests = result.data.newGuests || [];
        
        // Update event attendance count
        const totalPresent = attendanceData.filter((record: any) => 
          record.status === 'present' || record.status === 'late'
        ).length;
        
        // Update the event in our local data
        const eventIndex = this.sampleEvents.findIndex(e => e.id === event.id);
        if (eventIndex !== -1) {
          this.sampleEvents[eventIndex].attendeeCount = totalPresent;
          this.events$.next([...this.sampleEvents]);
        }
        
        // Show success message with guest info
        let message = `Attendance recorded for ${event.title}`;
        if (newGuests.length > 0) {
          message += ` (${newGuests.length} new guests added)`;
        }
        this.presentToast(message, 'success');
        
        // TODO: Save new guests to member database
        if (newGuests.length > 0) {
          console.log('New guests to save:', newGuests);
          // Here you would typically call a service to save guests to your member database
        }
      }
    });

    await modal.present();
  }
}

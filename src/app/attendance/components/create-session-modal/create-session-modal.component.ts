import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { AttendanceService } from '../../services/attendance.service';
import { Session, CreateSessionDto, DateTimeWithTimezone } from '../../models/attendance.model';
import { TimeUtils } from '../../../shared/utils/time.utils';
import { convertLocalToUTC } from '../../../shared/utils/date-timezone.util';

export interface CreateSessionForm {
  name: string;
  description: string;
  datetime: string | DateTimeWithTimezone;
  occurrence: 'once' | 'weekly' | 'monthly';
  location: string;
  type: 'service' | 'meeting' | 'event' | 'class';
  leader: string;
}

@Component({
  selector: 'app-create-session-modal',
  templateUrl: './create-session-modal.component.html',
  styleUrls: ['./create-session-modal.component.scss'],
  standalone: false
})
export class CreateSessionModalComponent implements OnInit {
  @Input() defaultType?: string;
  
  sessionForm!: FormGroup;
  isLoading = false;

  sessionTypeOptions = [
    { value: 'service', label: 'Service' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'class', label: 'Class' },
    { value: 'event', label: 'Event' }
  ];

  occurrenceOptions = [
    { 
      value: 'once', 
      label: 'One-time session', 
      description: 'Single occurrence only',
      icon: 'calendar-outline' 
    },
    { 
      value: 'weekly', 
      label: 'Weekly recurring', 
      description: 'Repeats every week',
      icon: 'refresh-outline' 
    },
    { 
      value: 'monthly', 
      label: 'Monthly recurring', 
      description: 'Repeats every month',
      icon: 'calendar-clear-outline' 
    }
  ];

  constructor(
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private attendanceService: AttendanceService,
    private toastController: ToastController
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    // Component initialization
  }

  private initializeForm() {
    this.sessionForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      datetime: ['', Validators.required],
      occurrence: ['once', Validators.required],
      location: ['', Validators.required],
      type: [this.defaultType || 'service'],
      leader: ['']
    });
  }

  async createSession() {
    if (this.sessionForm.valid) {
      this.isLoading = true;
      
      try {
        const formData = this.sessionForm.value;
        const sessionData = this.prepareSessionData(formData);
        
        // Call the service to create the session
        const newSession = await this.attendanceService.createSession(sessionData);
        
        this.dismiss({ created: true, session: newSession });
      } catch (error) {
        console.error('Error creating session:', error);
        // Show error feedback to user
        this.showErrorToast('Failed to create session. Please try again.');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
      this.showErrorToast('Please fill in all required fields correctly.');
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'danger',
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  private prepareSessionData(formData: CreateSessionForm): CreateSessionDto {
    // The datetime from the enhanced date picker now returns an object with timezone info
    const startDateTimeValue = formData.datetime;
    
    let startDateTime: string | DateTimeWithTimezone;
    let endDateTime: string | DateTimeWithTimezone;
    
    // Type guard to check if it's a DateTimeWithTimezone object
    const isDateTimeWithTimezone = (value: any): value is DateTimeWithTimezone => {
      return value && typeof value === 'object' && 'localTime' in value;
    };
    
    if (isDateTimeWithTimezone(startDateTimeValue)) {
      // New format with timezone info
      startDateTime = startDateTimeValue;
      
      // Calculate end time (1.5 hours later)
      const startDate = new Date(startDateTimeValue.utcTime || startDateTimeValue.localTime);
      const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
      
      // Create end datetime with same timezone offset
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      
      endDateTime = {
        localTime: `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`,
        timezoneOffsetMinutes: startDateTimeValue.timezoneOffsetMinutes,
        utcTime: endDate.toISOString()
      };
    } else {
      // Fallback to string format
      startDateTime = startDateTimeValue as string;
      const startDate = new Date(startDateTimeValue as string);
      const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
      endDateTime = endDate.toISOString();
    }
    
    // Map occurrence values to backend RecurrenceType enum
    const recurrenceTypeMap: { [key: string]: string } = {
      'once': 'one_time',
      'weekly': 'weekly',
      'monthly': 'monthly'
    };
    
    return {
      title: formData.name,
      description: formData.description || undefined,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      location: formData.location,
      type: formData.type as 'service' | 'meeting' | 'event' | 'class' || 'service',
      leader: formData.leader || undefined,
      tags: [], // We can add tag functionality later
      recurrenceType: recurrenceTypeMap[formData.occurrence] || 'one_time'
    };
  }

  private calculateEndTime(startDate: Date): string {
    // Default to 1.5 hours later
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
    return TimeUtils.formatTime12Hour(endDate);
  }

  private markFormGroupTouched() {
    Object.keys(this.sessionForm.controls).forEach(key => {
      this.sessionForm.get(key)?.markAsTouched();
    });
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  getFieldError(fieldName: string): string {
    const field = this.sessionForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Session name',
      datetime: 'Date and time',
      location: 'Location',
      occurrence: 'Occurrence',
      type: 'Session type',
      leader: 'Session leader'
    };
    return labels[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.sessionForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  selectOccurrence(occurrence: string) {
    this.sessionForm.patchValue({ occurrence });
  }

  formatDateTime(datetime: string): string {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getMinDateTime(): string {
    return new Date().toISOString();
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      service: 'people-outline',
      meeting: 'chatbubbles-outline',
      class: 'school-outline',
      event: 'calendar-outline'
    };
    return icons[type] || 'calendar-outline';
  }

  clearDateTime() {
    this.sessionForm.patchValue({ datetime: '' });
  }

  confirmDateTime() {
    // The datetime value is already bound via formControlName
    // This method is here if you need to perform additional actions
  }
}

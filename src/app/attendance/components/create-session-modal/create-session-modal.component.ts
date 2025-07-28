import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AttendanceService, Session } from '../../../services/attendance.service';

export interface CreateSessionForm {
  name: string;
  description: string;
  datetime: string;
  occurrence: 'once' | 'weekly' | 'monthly';
  location: string;
  type?: 'service' | 'meeting' | 'event' | 'class';
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

  occurrenceOptions = [
    { value: 'once', label: 'One-time session', icon: 'calendar-outline' },
    { value: 'weekly', label: 'Weekly recurring', icon: 'refresh-outline' },
    { value: 'monthly', label: 'Monthly recurring', icon: 'calendar-clear-outline' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private attendanceService: AttendanceService
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
      location: ['', Validators.required]
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
        // Could add toast notification here
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private prepareSessionData(formData: CreateSessionForm): Partial<Session> {
    const sessionDate = new Date(formData.datetime);
    
    return {
      title: formData.name,
      description: formData.description,
      date: sessionDate,
      startTime: sessionDate.toTimeString().slice(0, 5), // HH:MM format
      endTime: this.calculateEndTime(sessionDate),
      location: formData.location,
      type: 'service', // Default to service type
      status: 'upcoming',
      presentCount: 0,
      totalExpected: 0,
      attendanceRate: 0
    };
  }

  private calculateEndTime(startDate: Date): string {
    // Default to 1 hour later
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    return endDate.toTimeString().slice(0, 5);
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
      type: 'Session type'
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
}

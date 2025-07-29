import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { AttendanceService } from '../../../services/attendance.service';
import { Session, CreateSessionDto } from '../../../models/attendance.model';

export interface CreateSessionForm {
  name: string;
  description: string;
  datetime: string;
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

  occurrenceOptions = [
    { value: 'once', label: 'One-time session', icon: 'calendar-outline' },
    { value: 'weekly', label: 'Weekly recurring', icon: 'refresh-outline' },
    { value: 'monthly', label: 'Monthly recurring', icon: 'calendar-clear-outline' }
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
    const sessionDate = new Date(formData.datetime);
    
    return {
      title: formData.name,
      description: formData.description || undefined,
      date: sessionDate,
      startTime: sessionDate.toTimeString().slice(0, 5), // HH:MM format
      endTime: this.calculateEndTime(sessionDate),
      location: formData.location,
      type: formData.type as 'service' | 'meeting' | 'event' | 'class' || 'service',
      leader: formData.leader || undefined,
      tags: [] // We can add tag functionality later
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
}

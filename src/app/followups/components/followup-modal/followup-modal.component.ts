import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { FollowupService } from '../../services/followup.service';
import { FollowupDto, CreateFollowupDto, UpdateFollowupDto } from '../../models/followup.model';
import { ReferenceService, ReferenceOption } from '../../../services/reference.service';

@Component({
  selector: 'app-followup-modal',
  templateUrl: './followup-modal.component.html',
  styleUrls: ['./followup-modal.component.scss'],
  standalone: false
})
export class FollowupModalComponent implements OnInit {
  @Input() followupId: string | null = null; // Changed to receive ID instead of full object
  @Input() assignees: any[] = [];

  followupForm!: FormGroup;
  isLoading: boolean = false;
  followupData: FollowupDto | null = null;
  
  // Reference data
  followupTypes: ReferenceOption[] = [];
  priorities: ReferenceOption[] = [];
  statuses: ReferenceOption[] = [];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private followupService: FollowupService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private referenceService: ReferenceService
  ) {}

  async ngOnInit() {
    this.initializeForm();
    
    // Load reference data
    await this.loadReferenceData();
    
    if (this.followupId) {
      // Load followup data from backend using single service call
      await this.loadFollowupDetails();
    }
  }
  
  private async loadReferenceData() {
    try {
      const referenceData = await this.referenceService.getReferenceData().toPromise();
      if (referenceData) {
        this.followupTypes = referenceData.followupTypes;
        this.priorities = referenceData.priorities;
        this.statuses = referenceData.statuses;
      }
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }

  private async loadFollowupDetails() {
    if (!this.followupId) return;

    const loading = await this.loadingController.create({
      message: 'Loading followup details...'
    });
    await loading.present();

    try {
      this.followupData = await this.followupService.getFollowup(this.followupId);
      this.populateForm();
    } catch (error) {
      console.error('Error loading followup details:', error);
      await this.showToast('Error loading followup details', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private populateForm() {
    if (!this.followupData) return;

    this.followupForm.patchValue({
      personName: this.followupData.personName || '',
      title: this.followupData.title || '',
      description: this.followupData.description || '',
      type: this.followupData.type || 'Follow-up',
      priority: this.followupData.priority || 'medium',
      assignedTo: this.followupData.assignedTo || '',
      status: this.followupData.status || 'pending',
      dueDate: this.followupData.dueDate ? new Date(this.followupData.dueDate).toISOString().split('T')[0] : '',
      notes: this.followupData.notes || '',
      contactInfo: {
        phone: this.followupData.contactInfo?.phone || '',
        email: this.followupData.contactInfo?.email || ''
      }
    });
  }

  private initializeForm(): void {
    this.followupForm = this.formBuilder.group({
      personName: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      type: ['Follow-up', Validators.required],
      priority: ['medium', Validators.required],
      assignedTo: [''],
      status: ['pending', Validators.required],
      dueDate: [''],
      notes: [''],
      contactInfo: this.formBuilder.group({
        phone: [''],
        email: ['', Validators.email]
      })
    });
  }

  get isEditing(): boolean {
    return !!this.followupId;
  }

  get personNameControl() {
    return this.followupForm.get('personName');
  }

  get titleControl() {
    return this.followupForm.get('title');
  }

  get descriptionControl() {
    return this.followupForm.get('description');
  }

  get typeControl() {
    return this.followupForm.get('type');
  }

  get priorityControl() {
    return this.followupForm.get('priority');
  }

  get assignedToControl() {
    return this.followupForm.get('assignedTo');
  }

  get statusControl() {
    return this.followupForm.get('status');
  }

  get dueDateControl() {
    return this.followupForm.get('dueDate');
  }

  get notesControl() {
    return this.followupForm.get('notes');
  }

  get phoneControl() {
    return this.followupForm.get('contactInfo.phone');
  }

  get emailControl() {
    return this.followupForm.get('contactInfo.email');
  }

  getAssigneesList() {
    return this.assignees.filter(a => a.value !== 'all' && a.value !== 'unassigned');
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    return this.followupForm.valid;
  }

  async saveFollowup() {
    if (!this.isFormValid()) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.followupForm);
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditing ? 'Updating followup...' : 'Creating followup...'
    });
    await loading.present();

    try {
      const formValue = this.followupForm.value;
      
      // Format due date properly
      if (formValue.dueDate) {
        formValue.dueDate = new Date(formValue.dueDate).toISOString();
      }

      let savedFollowup: FollowupDto;

      if (this.isEditing && this.followupId) {
        // Update existing followup
        const updateData: UpdateFollowupDto = {
          personName: formValue.personName,
          title: formValue.title,
          description: formValue.description,
          type: formValue.type,
          priority: formValue.priority,
          status: formValue.status,
          assignedTo: formValue.assignedTo,
          dueDate: formValue.dueDate,
          notes: formValue.notes,
          contactInfo: formValue.contactInfo
        };
        
        savedFollowup = await this.followupService.updateFollowup(this.followupId, updateData);
        await this.showToast('Followup updated successfully!', 'success');
      } else {
        // Create new followup
        const createData: CreateFollowupDto = {
          personName: formValue.personName,
          title: formValue.title,
          description: formValue.description,
          type: formValue.type,
          priority: formValue.priority,
          assignedTo: formValue.assignedTo,
          dueDate: formValue.dueDate,
          notes: formValue.notes,
          contactInfo: formValue.contactInfo
        };
        
        savedFollowup = await this.followupService.createFollowup(createData);
        await this.showToast('Followup created successfully!', 'success');
      }

      // Close modal and pass the saved data back
      await this.modalController.dismiss({
        followup: savedFollowup,
        action: this.isEditing ? 'updated' : 'created'
      });

    } catch (error) {
      console.error('Error saving followup:', error);
      const errorMessage = this.isEditing ? 'Failed to update followup' : 'Failed to create followup';
      await this.showToast(errorMessage, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  async closeModal() {
    await this.modalController.dismiss();
  }
}
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-followup-modal',
  templateUrl: './followup-modal.component.html',
  styleUrls: ['./followup-modal.component.scss'],
  standalone: false
})
export class FollowupModalComponent implements OnInit {
  @Input() followup: any = null;
  @Input() assignees: any[] = [];

  followupForm!: FormGroup;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.initializeForm();
    
    if (this.followup) {
      // Editing existing followup
      this.followupForm.patchValue({
        personName: this.followup.personName || '',
        title: this.followup.title || '',
        description: this.followup.description || '',
        type: this.followup.type || 'General Follow-up',
        priority: this.followup.priority || 'medium',
        assignedTo: this.followup.assignedTo || '',
        status: this.followup.status || 'pending',
        dueDate: this.followup.dueDate || '',
        contactInfo: {
          phone: this.followup.contactInfo?.phone || '',
          email: this.followup.contactInfo?.email || ''
        }
      });
    }
  }

  private initializeForm(): void {
    this.followupForm = this.formBuilder.group({
      personName: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      type: ['General Follow-up', Validators.required],
      priority: ['medium', Validators.required],
      assignedTo: [''],
      status: ['pending', Validators.required],
      dueDate: [''],
      contactInfo: this.formBuilder.group({
        phone: [''],
        email: ['', Validators.email]
      })
    });
  }

  get isEditing(): boolean {
    return !!this.followup;
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

  get phoneControl() {
    return this.followupForm.get('contactInfo.phone');
  }

  get emailControl() {
    return this.followupForm.get('contactInfo.email');
  }

  getAssigneesList() {
    return this.assignees;
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
      Object.keys(this.followupForm.controls).forEach(key => {
        const control = this.followupForm.get(key);
        control?.markAsTouched();
      });
      
      // Also mark nested form group controls as touched
      const contactInfoGroup = this.followupForm.get('contactInfo');
      if (contactInfoGroup) {
        Object.keys((contactInfoGroup as FormGroup).controls).forEach(key => {
          const control = contactInfoGroup.get(key);
          control?.markAsTouched();
        });
      }
      return;
    }

    const formValue = this.followupForm.value;
    if (this.followup?.id) {
      formValue.id = this.followup.id;
    }

    await this.modalController.dismiss({
      followup: formValue,
      isEdit: this.isEditing
    });
  }

  async closeModal() {
    await this.modalController.dismiss();
  }
}
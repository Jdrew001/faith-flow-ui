import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { MembersService } from '../../services/members.service';
import { MemberStatus } from '../../models';

@Component({
  selector: 'app-member-create-modal',
  templateUrl: './member-create-modal.component.html',
  styleUrls: ['./member-create-modal.component.scss'],
  standalone: false
})
export class MemberCreateModalComponent implements OnInit {
  memberForm!: FormGroup;
  statusOptions = Object.values(MemberStatus);
  tags: string[] = [];
  isLoading = false;
  
  // Step management
  currentStep = 1;
  totalSteps = 4;
  
  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private membersService: MembersService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD for date picker
    
    this.memberForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
      birthdate: [''],
      anniversary: [''],
      status: [MemberStatus.ACTIVE, Validators.required],
      membership_date: [today],
      notes: ['']
    });
  }

  async save() {
    if (this.memberForm.invalid) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const memberData = {
        ...this.memberForm.value,
        tags: this.tags
      };
      
      const newMember = await this.membersService.createMember(memberData).toPromise();
      
      await this.showToast('Member created successfully', 'success');
      
      await this.modalController.dismiss({
        created: true,
        member: newMember
      });
    } catch (error) {
      console.error('Error creating member:', error);
      await this.showToast('Failed to create member', 'danger');
      this.isLoading = false;
    }
  }

  addTag(event: any) {
    const input = event.target || event;
    const tag = input.value?.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      input.value = '';
    }
  }

  addSuggestedTag(tag: string) {
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  close() {
    this.modalController.dismiss();
  }
  
  // Step Navigation Methods
  nextStep() {
    if (this.currentStep < this.totalSteps && this.isStepValid()) {
      this.currentStep++;
    }
  }
  
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  goToStep(step: number) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }
  
  skipStep() {
    // Skip address step (step 2)
    if (this.currentStep === 2) {
      this.currentStep++;
    }
  }
  
  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        // Personal info - only name is required
        return this.memberForm.get('name')?.valid || false;
      case 2:
        // Address - all optional
        return true;
      case 3:
        // Membership - status is required
        return this.memberForm.get('status')?.valid || false;
      case 4:
        // Review - check overall form validity
        return this.memberForm.valid;
      default:
        return false;
    }
  }
  
  getStepLabel(step: number): string {
    switch (step) {
      case 1:
        return 'Personal';
      case 2:
        return 'Address';
      case 3:
        return 'Membership';
      case 4:
        return 'Review';
      default:
        return '';
    }
  }
  
  hasValidAddress(): boolean {
    const address = this.memberForm.get('address')?.value;
    const city = this.memberForm.get('city')?.value;
    const state = this.memberForm.get('state')?.value;
    const zip = this.memberForm.get('zip')?.value;
    
    return !!(address || city || state || zip);
  }
  
  getFullAddress(): string {
    const address = this.memberForm.get('address')?.value || '';
    const city = this.memberForm.get('city')?.value || '';
    const state = this.memberForm.get('state')?.value || '';
    const zip = this.memberForm.get('zip')?.value || '';
    
    let fullAddress = address;
    if (city || state || zip) {
      if (fullAddress) fullAddress += ', ';
      if (city) fullAddress += city;
      if (state) fullAddress += (city ? ', ' : '') + state;
      if (zip) fullAddress += ' ' + zip;
    }
    
    return fullAddress || 'No address provided';
  }
  
  getStatusColor(status: MemberStatus): string {
    switch (status) {
      case MemberStatus.ACTIVE:
        return 'success';
      case MemberStatus.INACTIVE:
        return 'warning';
      case MemberStatus.VISITOR:
        return 'primary';
      default:
        return 'medium';
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
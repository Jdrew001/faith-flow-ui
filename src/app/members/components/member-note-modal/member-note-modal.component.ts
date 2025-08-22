import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { MembersService } from '../../services/members.service';

@Component({
  selector: 'app-member-note-modal',
  templateUrl: './member-note-modal.component.html',
  styleUrls: ['./member-note-modal.component.scss'],
  standalone: false
})
export class MemberNoteModalComponent implements OnInit {
  @Input() memberId!: string;
  @Input() memberName!: string;
  
  noteForm!: FormGroup;
  isLoading = false;

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
    this.noteForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  get content() {
    return this.noteForm.get('content');
  }

  hasError(field: string): boolean {
    const control = this.noteForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.noteForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'This field is required';
      }
      if (control.errors['minlength']) {
        return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      }
    }
    return '';
  }

  async save() {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Adding note...'
    });
    await loading.present();

    try {
      const response = await this.membersService.addMemberNote(
        this.memberId,
        this.noteForm.value.content
      ).toPromise();
      
      // Create note object with proper structure if API doesn't return it
      const newNote = response || {
        id: Date.now().toString(),
        content: this.noteForm.value.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await this.showToast('Note added successfully', 'success');
      
      await this.modalController.dismiss({
        note: newNote
      });
    } catch (error) {
      console.error('Error adding note:', error);
      await this.showToast('Failed to add note', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  close() {
    this.modalController.dismiss();
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
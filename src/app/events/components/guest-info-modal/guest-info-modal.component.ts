import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Member } from '../attendance-modal/attendance-modal.component';

@Component({
  selector: 'app-guest-info-modal',
  templateUrl: './guest-info-modal.component.html',
  styleUrls: ['./guest-info-modal.component.scss'],
  standalone: false
})
export class GuestInfoModalComponent implements OnInit {
  @Input() guest!: Member;

  guestForm = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl(''),
    phone: new FormControl(''),
    address: new FormControl(''),
    howDidYouHear: new FormControl(''),
    interests: new FormControl(''),
    followUpPreference: new FormControl('email')
  });

  interestOptions = [
    'Worship Services',
    'Bible Study',
    'Youth Ministry',
    'Children\'s Ministry',
    'Community Outreach',
    'Music Ministry',
    'Small Groups',
    'Prayer Ministry'
  ];

  constructor(
    private modalController: ModalController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    if (this.guest) {
      this.guestForm.patchValue({
        firstName: this.guest.firstName,
        lastName: this.guest.lastName,
        email: this.guest.email || '',
        phone: this.guest.phone || ''
      });
    }
  }

  async saveGuestInfo() {
    if (this.guestForm.valid) {
      const formValue = this.guestForm.value;
      const updatedGuest: Member = {
        ...this.guest,
        firstName: formValue.firstName || this.guest.firstName,
        lastName: formValue.lastName || this.guest.lastName,
        email: formValue.email || undefined,
        phone: formValue.phone || undefined
      };
      
      this.modalController.dismiss(updatedGuest);
    } else {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please fill in the required fields (First Name and Last Name).',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}

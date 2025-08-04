import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-update-modal',
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.scss'],
  standalone: false,
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        animate('400ms ease-out', keyframes([
          style({ transform: 'translateY(100%)', opacity: 0, offset: 0 }),
          style({ transform: 'translateY(0)', opacity: 1, offset: 1 })
        ]))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms 200ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('pulseGlow', [
      transition(':enter', [
        animate('2s ease-in-out infinite', keyframes([
          style({ transform: 'scale(1)', opacity: 0.8, offset: 0 }),
          style({ transform: 'scale(1.05)', opacity: 1, offset: 0.5 }),
          style({ transform: 'scale(1)', opacity: 0.8, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class UpdateModalComponent implements OnInit {
  features = [
    { icon: 'rocket-outline', text: 'Performance improvements' },
    { icon: 'bug-outline', text: 'Bug fixes and stability' },
    { icon: 'sparkles-outline', text: 'New features and enhancements' }
  ];

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  async updateNow() {
    await this.modalController.dismiss({ action: 'update' });
  }

  async updateLater() {
    await this.modalController.dismiss({ action: 'later' });
  }

  async dismiss() {
    await this.modalController.dismiss({ action: 'dismiss' });
  }
}
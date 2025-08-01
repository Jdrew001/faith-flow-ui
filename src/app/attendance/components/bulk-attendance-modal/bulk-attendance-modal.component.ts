import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-bulk-attendance-modal',
  templateUrl: './bulk-attendance-modal.component.html',
  styleUrls: ['./bulk-attendance-modal.component.scss'],
  standalone: false
})
export class BulkAttendanceModalComponent {
  @Input() session: any;

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  importFromFile() {
    console.log('Import from file functionality - to be implemented');
    // TODO: Implement file import functionality
  }

  markAllPresent() {
    console.log('Mark all present functionality - to be implemented');
    // TODO: Implement mark all present functionality
    this.modalCtrl.dismiss({ attendance: 'all_present' });
  }

  useTemplate() {
    console.log('Use template functionality - to be implemented');
    // TODO: Implement template functionality
  }
}

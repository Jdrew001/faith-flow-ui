import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { ModalController } from '@ionic/angular';
import { UpdateModalComponent } from './shared/components/update-modal/update-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private swUpdate: SwUpdate,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        switch (event.type) {
          case 'VERSION_READY':
            this.promptUserToUpdate();
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.error('Failed to install new version:', event.error);
            break;
        }
      });

      // Check for updates every 30 seconds
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);
    }
  }

  private async promptUserToUpdate() {
    const modal = await this.modalController.create({
      component: UpdateModalComponent,
      cssClass: 'update-modal',
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8,
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    
    if (data?.action === 'update') {
      // Show loading state or perform update
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else if (data?.action === 'later') {
      // Schedule another check in 1 hour
      setTimeout(() => {
        this.swUpdate.checkForUpdate();
      }, 3600000);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private swUpdate: SwUpdate,
    private alertController: AlertController
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
    const alert = await this.alertController.create({
      header: 'Update Available',
      message: 'A new version of Faith Flow is available. Would you like to update now?',
      buttons: [
        {
          text: 'Later',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });

    await alert.present();
  }
}

import { Component, OnInit } from '@angular/core';
import { PwaService } from './pwa.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-pwa-install',
  template: `
    <ion-button 
      *ngIf="pwaService.installable" 
      fill="outline" 
      size="small"
      (click)="installApp()"
      class="pwa-install-button">
      <ion-icon name="download-outline" slot="start"></ion-icon>
      Install App
    </ion-button>
  `,
  styles: [`
    .pwa-install-button {
      margin: 8px;
      --border-radius: 20px;
    }
  `],
  standalone: false
})
export class PwaInstallComponent implements OnInit {

  constructor(
    public pwaService: PwaService,
    private toastController: ToastController
  ) { }

  ngOnInit() {}

  async installApp() {
    const installed = await this.pwaService.installPWA();
    
    if (installed) {
      const toast = await this.toastController.create({
        message: 'App installed successfully!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      toast.present();
    } else {
      const toast = await this.toastController.create({
        message: 'Installation was cancelled or failed',
        duration: 2000,
        color: 'warning',
        position: 'bottom'
      });
      toast.present();
    }
  }
}

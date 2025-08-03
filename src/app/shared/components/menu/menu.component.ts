import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { User } from 'src/app/auth/model/auth.model';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: false
})
export class MenuComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private authSubscription?: Subscription;

  public appPages = [
    { title: 'Dashboard', url: '/summary', icon: 'grid' },
    { title: 'Attendance', url: '/attendance', icon: 'people' },
    { title: 'Follow-ups', url: '/followups', icon: 'heart' },
    { title: 'Workflows', url: '/workflows', icon: 'git-branch' },
    { title: 'Reports', url: '/reports', icon: 'analytics' },
    { title: 'Settings', url: '/settings', icon: 'settings' }
  ];

  public quickActions = [
    { title: 'Add Visitor', icon: 'person-add', action: 'addVisitor' },
    { title: 'Prayer Request', icon: 'heart', action: 'prayerRequest' },
    { title: 'Send Message', icon: 'mail', action: 'sendMessage' },
    { title: 'New Session', icon: 'add-circle', action: 'createSession' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private menuCtrl: MenuController
  ) { }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  logout() {
    this.authService.logout();
    this.menuCtrl.close();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  handleQuickAction(action: string) {
    switch (action) {
      case 'addVisitor':
        console.log('Add visitor functionality');
        break;
      case 'prayerRequest':
        console.log('Prayer request functionality');
        break;
      case 'sendMessage':
        console.log('Send message functionality');
        break;
      case 'createSession':
        this.router.navigate(['/attendance'], { queryParams: { action: 'create' } });
        this.menuCtrl.close();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return 'Member';
    const role = this.currentUser.role || 'member';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

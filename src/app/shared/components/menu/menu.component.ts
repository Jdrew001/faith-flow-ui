import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';

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
    { title: 'Home', url: '/folder/home', icon: 'home' },
    { title: 'Prayer Requests', url: '/folder/prayer', icon: 'heart' },
    { title: 'Sermons', url: '/folder/sermons', icon: 'library' },
    { title: 'Events', url: '/folder/events', icon: 'calendar' },
    { title: 'Community', url: '/folder/community', icon: 'people' },
    { title: 'Giving', url: '/folder/giving', icon: 'card' },
    { title: 'Resources', url: '/folder/resources', icon: 'book' }
  ];

  public labels = [
    'Favorites',
    'Recent',
    'Important',
    'Archived'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
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
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

}

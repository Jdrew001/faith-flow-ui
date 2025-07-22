import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  standalone: false
})
export class EventsPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    // Auto-redirect to attendance page after 3 seconds
    setTimeout(() => {
      this.goToAttendance();
    }, 3000);
  }

  goToAttendance() {
    this.router.navigate(['/attendance']);
  }

  goToDashboard() {
    this.router.navigate(['/summary']);
  }
}

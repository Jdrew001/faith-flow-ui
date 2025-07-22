import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Session, AttendanceService, Person } from '../../../services/attendance.service';

@Component({
  selector: 'app-quick-mark-attendance',
  templateUrl: './quick-mark-attendance.component.html',
  styleUrls: ['./quick-mark-attendance.component.scss'],
  standalone: false
})
export class QuickMarkAttendanceComponent implements OnInit {
  @Input() session!: Session;
  
  people: Person[] = [];
  filteredPeople: Person[] = [];
  searchTerm = '';
  isLoading = true;
  attendanceMap = new Map<string, 'Present' | 'Absent'>();

  constructor(
    private modalCtrl: ModalController,
    private attendanceService: AttendanceService
  ) {}

  async ngOnInit() {
    await this.loadPeople();
  }

  private async loadPeople() {
    try {
      this.isLoading = true;
      this.people = await this.attendanceService.getPeople();
      this.filteredPeople = [...this.people];
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterPeople();
  }

  private filterPeople() {
    if (!this.searchTerm) {
      this.filteredPeople = [...this.people];
    } else {
      this.filteredPeople = this.people.filter(person =>
        person.name.toLowerCase().includes(this.searchTerm) ||
        person.email?.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  markAttendance(person: Person, status: 'Present' | 'Absent') {
    this.attendanceMap.set(person.id, status);
  }

  getAttendanceStatus(personId: string): 'Present' | 'Absent' | null {
    return this.attendanceMap.get(personId) || null;
  }

  markAllPresent() {
    this.filteredPeople.forEach(person => {
      this.attendanceMap.set(person.id, 'Present');
    });
  }

  markAllAbsent() {
    this.filteredPeople.forEach(person => {
      this.attendanceMap.set(person.id, 'Absent');
    });
  }

  clearAll() {
    this.attendanceMap.clear();
  }

  async saveAttendance() {
    try {
      const attendanceData = Array.from(this.attendanceMap.entries()).map(([personId, status]) => ({
        personId,
        status
      }));

      if (attendanceData.length === 0) {
        return;
      }

      await this.attendanceService.bulkMarkAttendance(this.session.id, attendanceData);
      this.dismiss({ attendance: attendanceData });
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  getPresentCount(): number {
    return Array.from(this.attendanceMap.values()).filter(status => status === 'Present').length;
  }

  getAbsentCount(): number {
    return Array.from(this.attendanceMap.values()).filter(status => status === 'Absent').length;
  }

  getMarkedCount(): number {
    return this.attendanceMap.size;
  }

  trackByPersonId(index: number, person: Person): string {
    return person.id;
  }
}

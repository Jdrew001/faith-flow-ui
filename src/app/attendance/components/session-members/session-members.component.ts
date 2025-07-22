import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController, ActionSheetController } from '@ionic/angular';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Session, AttendanceService, AttendanceRecord, Person } from '../../../services/attendance.service';

interface MemberAttendance {
  id: string;
  personId: string;
  personName: string;
  avatar?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Unmarked';
  timestamp?: string;
  notes?: string;
}

@Component({
  selector: 'app-session-members',
  templateUrl: './session-members.component.html',
  styleUrls: ['./session-members.component.scss'],
  standalone: false
})
export class SessionMembersComponent implements OnInit {
  @Input() session!: Session;
  
  members: MemberAttendance[] = [];
  filteredMembers: MemberAttendance[] = [];
  searchControl = new FormControl('');
  selectedFilter = 'all'; // all, unmarked, present, absent
  isLoading = true;
  
  // Stats
  presentCount = 0;
  absentCount = 0;
  unmarkedCount = 0;
  attendanceRate = 0;

  constructor(
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private attendanceService: AttendanceService
  ) {}

  async ngOnInit() {
    await this.loadMembers();
    this.setupSearch();
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.filterMembers();
      });
  }

  async loadMembers() {
    this.isLoading = true;
    try {
      // Load session attendance records
      const attendanceRecords = await this.attendanceService.getSessionAttendance(this.session.id);
      const allPeople = await this.attendanceService.getPeople();
      
      // Create member attendance list
      this.members = allPeople.map(person => {
        const attendance = attendanceRecords.find(record => record.personId === person.id);
        return {
          id: attendance?.id || '',
          personId: person.id,
          personName: person.name,
          avatar: person.avatar,
          status: attendance?.status === 'Present' ? 'Present' : 
                  attendance?.status === 'Absent' ? 'Absent' : 'Unmarked',
          timestamp: attendance?.timestamp,
          notes: attendance?.notes
        };
      });

      this.calculateStats();
      this.filterMembers();
    } catch (error) {
      console.error('Error loading members:', error);
      await this.showToast('Error loading member list', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  filterMembers() {
    let filtered = [...this.members];

    // Filter by search term
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.personName.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by status
    switch (this.selectedFilter) {
      case 'unmarked':
        filtered = filtered.filter(member => member.status === 'Unmarked');
        break;
      case 'present':
        filtered = filtered.filter(member => member.status === 'Present');
        break;
      case 'absent':
        filtered = filtered.filter(member => member.status === 'Absent');
        break;
    }

    this.filteredMembers = filtered;
  }

  calculateStats() {
    this.presentCount = this.members.filter(m => m.status === 'Present').length;
    this.absentCount = this.members.filter(m => m.status === 'Absent').length;
    this.unmarkedCount = this.members.filter(m => m.status === 'Unmarked').length;
    this.attendanceRate = this.members.length > 0 ? 
      Math.round((this.presentCount / this.members.length) * 100) : 0;
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.filterMembers();
  }

  async toggleMemberStatus(member: MemberAttendance) {
    const actionSheet = await this.actionSheetController.create({
      header: member.personName,
      buttons: [
        {
          text: 'Present',
          icon: 'checkmark-circle',
          cssClass: member.status === 'Present' ? 'selected' : '',
          handler: () => this.updateMemberStatus(member, 'Present')
        },
        {
          text: 'Absent',
          icon: 'close-circle',
          cssClass: member.status === 'Absent' ? 'selected' : '',
          handler: () => this.updateMemberStatus(member, 'Absent')
        },
        {
          text: 'Late',
          icon: 'time',
          cssClass: member.status === 'Late' ? 'selected' : '',
          handler: () => this.updateMemberStatus(member, 'Late')
        },
        {
          text: 'Excused',
          icon: 'information-circle',
          cssClass: member.status === 'Excused' ? 'selected' : '',
          handler: () => this.updateMemberStatus(member, 'Excused')
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async updateMemberStatus(member: MemberAttendance, status: 'Present' | 'Absent' | 'Late' | 'Excused') {
    try {
      member.status = status;
      member.timestamp = new Date().toISOString();
      
      // Update in service (mock for now)
      await this.attendanceService.updateAttendanceRecord(this.session.id, member.personId, status);
      
      this.calculateStats();
      this.filterMembers();
      
      await this.showToast(`${member.personName} marked as ${status}`, 'success');
    } catch (error) {
      console.error('Error updating attendance:', error);
      await this.showToast('Error updating attendance', 'danger');
    }
  }

  async markAllPresent() {
    try {
      for (const member of this.members) {
        if (member.status !== 'Present') {
          member.status = 'Present';
          member.timestamp = new Date().toISOString();
        }
      }
      
      this.calculateStats();
      this.filterMembers();
      
      await this.showToast('All members marked as present', 'success');
    } catch (error) {
      console.error('Error marking all present:', error);
      await this.showToast('Error updating attendance', 'danger');
    }
  }

  async markAllAbsent() {
    try {
      for (const member of this.members) {
        if (member.status !== 'Absent') {
          member.status = 'Absent';
          member.timestamp = new Date().toISOString();
        }
      }
      
      this.calculateStats();
      this.filterMembers();
      
      await this.showToast('All members marked as absent', 'warning');
    } catch (error) {
      console.error('Error marking all absent:', error);
      await this.showToast('Error updating attendance', 'danger');
    }
  }

  async clearAll() {
    try {
      for (const member of this.members) {
        member.status = 'Unmarked';
        member.timestamp = undefined;
      }
      
      this.calculateStats();
      this.filterMembers();
      
      await this.showToast('All attendance cleared', 'medium');
    } catch (error) {
      console.error('Error clearing attendance:', error);
      await this.showToast('Error clearing attendance', 'danger');
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Present': return 'checkmark-circle';
      case 'Absent': return 'close-circle';
      case 'Late': return 'time';
      case 'Excused': return 'information-circle';
      default: return 'help-circle-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'danger';
      case 'Late': return 'warning';
      case 'Excused': return 'medium';
      default: return 'light';
    }
  }

  trackByMemberId(index: number, member: MemberAttendance): string {
    return member.personId;
  }

  getInitials(name: string): string {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2); // Limit to 2 characters
  }

  async dismiss() {
    await this.modalCtrl.dismiss({
      updated: true,
      stats: {
        present: this.presentCount,
        absent: this.absentCount,
        rate: this.attendanceRate
      }
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}

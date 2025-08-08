import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ModalController, ToastController, ActionSheetController } from '@ionic/angular';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AttendanceService } from '../../services/attendance.service';
import { Session, AttendanceRecord, Person } from '../../models/attendance.model';
import { AutoHideHeaderDirective } from '../../../shared/directives';

interface MemberAttendance {
  id: string;
  personId: string;
  personName: string;
  avatar?: string;
  status: 'Present' | 'Absent' | 'Unmarked';
  timestamp?: string;
  notes?: string;
  selected?: boolean; // Add selection state
}

@Component({
  selector: 'app-session-members',
  templateUrl: './session-members.component.html',
  styleUrls: ['./session-members.component.scss'],
  standalone: false
})
export class SessionMembersComponent implements OnInit, OnDestroy {
  @Input() session!: Session;
  
  members: MemberAttendance[] = [];
  filteredMembers: MemberAttendance[] = [];
  searchControl = new FormControl('');
  selectedFilter = 'all'; // all, unmarked, present, absent
  isLoading = true;
  
  // Selection state
  isSelectionMode = false;
  selectedMembers: Set<string> = new Set();
  longPressActive = false;
  longPressTimer: any;
  touchStartTime = 0;
  
  
  // Stats
  presentCount = 0;
  absentCount = 0;
  unmarkedCount = 0;
  attendanceRate = 0;
  
  // UI State
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;
  activeFilterCount = 0;
  lastUpdated: Date = new Date();
  showSuccessAnimation = false;
  successMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private attendanceService: AttendanceService
  ) {}

  async ngOnInit() {
    // Load saved preferences
    const savedViewMode = localStorage.getItem('attendanceViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }
    
    await this.loadMembers();
    this.setupSearch();
  }

  ngOnDestroy() {
    // Clean up timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
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
      // Use the faster getActiveMembers method instead of getPeople
      const allPeople = await this.attendanceService.getActiveMembers();
      
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
    
    // Calculate attendance rate as present out of total members
    this.attendanceRate = this.members.length > 0 ? 
      Math.round((this.presentCount / this.members.length) * 100) : 0;
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.filterMembers();
    this.updateActiveFilterCount();
  }
  
  updateActiveFilterCount() {
    this.activeFilterCount = 0;
    if (this.selectedFilter !== 'all') this.activeFilterCount++;
    if (this.searchControl.value) this.activeFilterCount++;
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
          text: 'Unmarked',
          icon: 'help-circle-outline',
          cssClass: member.status === 'Unmarked' ? 'selected' : '',
          handler: () => this.updateMemberStatus(member, 'Unmarked')
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

  async updateMemberStatus(member: MemberAttendance, status: 'Present' | 'Absent' | 'Unmarked', event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const previousStatus = member.status;
    
    try {
      member.status = status;
      
      if (status === 'Unmarked') {
        member.timestamp = undefined;
        // Clear the attendance record for unmarked status
        await this.attendanceService.updateAttendanceRecord(this.session.id, member.personId, 'Unmarked');
      } else {
        member.timestamp = new Date().toISOString();
        // Update in service for other statuses
        await this.attendanceService.updateAttendanceRecord(this.session.id, member.personId, status);
      }
      
      this.calculateStats();
      this.filterMembers();
      this.lastUpdated = new Date();
      
      // Show success animation for bulk actions
      if (this.isSelectionMode && this.selectedCount > 1) {
        this.successMessage = `${this.selectedCount} members marked as ${status}`;
        this.showSuccessAnimation = true;
        setTimeout(() => {
          this.showSuccessAnimation = false;
          this.exitSelectionMode();
        }, 2000);
      } else {
        await this.showToast(`${member.personName} marked as ${status}`, 'success');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      member.status = previousStatus; // Revert on error
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

  // Enhanced selection mode management
  exitSelectionMode() {
    this.isSelectionMode = false;
    this.selectedMembers.clear();
    this.members.forEach(member => member.selected = false);
    this.longPressActive = false;
    
    // Clear any active timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }

  // Bulk Selection Methods
  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.exitSelectionMode();
    }
  }

  toggleMemberSelection(member: MemberAttendance, event: Event) {
    event.stopPropagation();
    
    if (this.selectedMembers.has(member.personId)) {
      this.selectedMembers.delete(member.personId);
      member.selected = false;
    } else {
      this.selectedMembers.add(member.personId);
      member.selected = true;
    }
  }

  selectAllVisible() {
    this.filteredMembers.forEach(member => {
      member.selected = true;
      this.selectedMembers.add(member.personId);
    });
  }

  deselectAll() {
    this.selectedMembers.clear();
    this.members.forEach(member => member.selected = false);
  }

  async markSelectedAs(status: 'Present' | 'Absent' | 'Unmarked') {
    if (this.selectedMembers.size === 0) {
      await this.showToast('No members selected', 'warning');
      return;
    }

    try {
      const selectedMembersList = this.members.filter(member => 
        this.selectedMembers.has(member.personId)
      );

      for (const member of selectedMembersList) {
        member.status = status;
        member.timestamp = new Date().toISOString();
        
        // Update in service
        await this.attendanceService.updateAttendanceRecord(this.session.id, member.personId, status);
      }
      
      this.calculateStats();
      this.filterMembers();
      
      await this.showToast(`${selectedMembersList.length} members marked as ${status}`, 'success');
      
      // Exit selection mode after bulk operation
      this.exitSelectionMode();
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      await this.showToast('Error updating attendance', 'danger');
    }
  }

  get selectedCount(): number {
    return this.selectedMembers.size;
  }
  
  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    // Save preference
    localStorage.setItem('attendanceViewMode', this.viewMode);
  }
  
  toggleFilterView() {
    this.showFilters = !this.showFilters;
  }
  
  enterSelectionMode() {
    this.isSelectionMode = true;
  }
  
  exportAttendance() {
    // Export functionality would go here
    this.showToast('Export feature coming soon!', 'primary');
  }
  
  openSettings() {
    // Settings functionality
    this.showToast('Settings coming soon!', 'primary');
  }
  
  getTimeSinceUpdate(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  }

  // Handle member row clicks - either select or show status menu
  async handleMemberClick(member: MemberAttendance, event: Event) {
    // Prevent action if this was a long press
    if (this.longPressActive) {
      return;
    }
    
    // Check if this was a quick tap (less than 200ms)
    const tapDuration = Date.now() - this.touchStartTime;
    
    if (this.isSelectionMode) {
      this.toggleMemberSelection(member, event);
    } else if (tapDuration < 200) {
      // Quick tap - cycle through status
      await this.quickStatusToggle(member, event);
    } else {
      // Longer tap - show full action sheet
      await this.toggleMemberStatus(member);
    }
  }

  // Touch and long press handlers for better UX
  onTouchStart(member: MemberAttendance, event: TouchEvent) {
    this.touchStartTime = Date.now();
    this.longPressActive = false;
    
    // Clear any existing timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    // Start long press timer (reduced to 350ms for better responsiveness)
    this.longPressTimer = setTimeout(() => {
      this.longPressActive = true;
      this.onLongPress(member);
    }, 350);
  }

  onTouchEnd(event: TouchEvent) {
    // Clear the long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    // Reset long press state after a short delay
    setTimeout(() => {
      this.longPressActive = false;
    }, 100);
  }

  onTouchMove(event: TouchEvent) {
    // Cancel long press if user moves finger (scrolling)
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }

  onLongPress(member: MemberAttendance) {
    // If not in selection mode, enter it and select this member
    if (!this.isSelectionMode) {
      this.isSelectionMode = true;
      this.selectedMembers.add(member.personId);
      member.selected = true;
      
      // Enhanced haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]); // Pattern: vibrate-pause-vibrate
      }
      
      // Add visual feedback class
      this.addLongPressVisualFeedback(member);
      
      // Show toast feedback
      this.showToast(`Selection mode activated. ${member.personName} selected.`, 'primary');
    }
  }

  private addLongPressVisualFeedback(member: MemberAttendance) {
    // Add temporary visual feedback
    const memberElement = document.querySelector(`[data-member-id="${member.personId}"]`);
    if (memberElement) {
      memberElement.classList.add('long-press-feedback');
      setTimeout(() => {
        memberElement.classList.remove('long-press-feedback');
      }, 200);
    }
  }

  // Quick status toggle for single tap when not in selection mode
  async quickStatusToggle(member: MemberAttendance, event: Event) {
    event.stopPropagation();
    
    // Cycle through: Unmarked -> Present -> Absent -> Unmarked
    let newStatus: 'Present' | 'Absent' | 'Unmarked';
    
    switch (member.status) {
      case 'Unmarked':
        newStatus = 'Present';
        break;
      case 'Present':
        newStatus = 'Absent';
        break;
      case 'Absent':
        newStatus = 'Unmarked';
        break;
      default:
        newStatus = 'Present';
    }
    
    await this.updateMemberStatus(member, newStatus);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Present': return 'checkmark-circle';
      case 'Absent': return 'remove-circle';
      case 'Unmarked': return 'help-circle-outline';
      default: return 'help-circle-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'danger';
      case 'Unmarked': return 'warning';
      default: return 'warning';
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
    // Check if session time has ended and auto-mark unmarked as absent
    await this.autoMarkUnmarkedAsAbsent();
    
    await this.modalCtrl.dismiss({
      updated: true,
      stats: {
        present: this.presentCount,
        absent: this.absentCount,
        rate: this.attendanceRate
      }
    });
  }

  showMemberOptions(member: MemberAttendance, event: Event) {
    event.stopPropagation();
    this.toggleMemberStatus(member);
  }
  
  async autoMarkUnmarkedAsAbsent() {
    // Check if the session has ended (compare current time with session end time)
    const sessionEndTime = this.getSessionEndDateTime();
    const now = new Date();
    
    if (now >= sessionEndTime) {
      const unmarkedMembers = this.members.filter(member => member.status === 'Unmarked');
      
      if (unmarkedMembers.length > 0) {
        // Show confirmation dialog
        const shouldAutoMark = await this.showAutoMarkConfirmation(unmarkedMembers.length);
        
        if (shouldAutoMark) {
          try {
            // Use backend endpoint for auto-marking
            const result = await this.attendanceService.autoMarkUnmarkedAsAbsent(this.session.id);
            
            // Update local state to reflect the changes
            for (const member of unmarkedMembers) {
              member.status = 'Absent';
              member.timestamp = new Date().toISOString();
            }
            
            this.calculateStats();
            this.filterMembers();
            
            await this.showToast(`${result.markedCount || unmarkedMembers.length} unmarked members marked as absent`, 'warning');
          } catch (error) {
            console.error('Error auto-marking unmarked as absent:', error);
            
            // Fallback to local marking if backend fails
            for (const member of unmarkedMembers) {
              try {
                await this.attendanceService.updateAttendanceRecord(this.session.id, member.personId, 'Absent');
                member.status = 'Absent';
                member.timestamp = new Date().toISOString();
              } catch (updateError) {
                console.error(`Failed to mark ${member.personName} as absent:`, updateError);
              }
            }
            
            this.calculateStats();
            this.filterMembers();
            
            await this.showToast(`${unmarkedMembers.length} unmarked members marked as absent (local fallback)`, 'warning');
          }
        }
      }
    }
  }

  private getSessionEndDateTime(): Date {
    const sessionDate = new Date(this.session.date);
    if (this.session.endTime) {
      const [hours, minutes] = this.session.endTime.split(':').map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);
    }
    return sessionDate;
  }

  private async showAutoMarkConfirmation(count: number): Promise<boolean> {
    return new Promise(async (resolve) => {
      const actionSheet = await this.actionSheetController.create({
        header: 'Session Ended',
        subHeader: `${count} members are still unmarked. Mark them as absent?`,
        buttons: [
          {
            text: `Mark ${count} as Absent`,
            icon: 'close-circle',
            cssClass: 'danger-button',
            handler: () => resolve(true)
          },
          {
            text: 'Leave Unmarked',
            icon: 'help-circle',
            handler: () => resolve(false)
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
            handler: () => resolve(false)
          }
        ]
      });

      await actionSheet.present();
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

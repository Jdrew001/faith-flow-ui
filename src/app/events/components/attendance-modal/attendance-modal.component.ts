import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Event } from '../../model/event.model';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipStatus: 'active' | 'inactive' | 'visitor';
  avatar?: string;
  lastAttended?: string;
}

export interface AttendanceRecord {
  memberId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  checkedInAt?: Date;
  checkedInBy?: string;
}

@Component({
  selector: 'app-attendance-modal',
  templateUrl: './attendance-modal.component.html',
  styleUrls: ['./attendance-modal.component.scss'],
  standalone: false
})
export class AttendanceModalComponent implements OnInit {
  @Input() event!: Event;
  @Input() members: Member[] = [];

  searchControl = new FormControl('');
  filteredMembers: Member[] = [];
  attendanceRecords: Map<string, AttendanceRecord> = new Map();
  
  // Statistics
  presentCount = 0;
  absentCount = 0;
  lateCount = 0;
  excusedCount = 0;
  totalMembers = 0;

  // FAB Menu state
  fabMenuOpen = false;
  
  // Loading states
  isSaving = false;

  // Modern Modal states
  showAddGuestModal = false;
  showQuickCheckInModal = false;
  showNoteModal = false;
  showMarkAllPresentModal = false;
  
  // Forms for modern modals
  addGuestForm!: FormGroup;
  noteForm!: FormGroup;
  
  // Quick check-in data
  quickCheckInSearch = '';
  quickCheckInResults: Member[] = [];
  
  // Note modal data
  noteModalData: {
    memberId: string;
    memberName: string;
    isEdit: boolean;
  } = { memberId: '', memberName: '', isEdit: false };

  // Sample members data - replace with real API
  sampleMembers: Member[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      membershipStatus: 'active',
      lastAttended: '2025-07-14'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@email.com',
      membershipStatus: 'active',
      lastAttended: '2025-07-20'
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@email.com',
      membershipStatus: 'active',
      lastAttended: '2025-07-07'
    },
    {
      id: '4',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@email.com',
      membershipStatus: 'active'
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@email.com',
      membershipStatus: 'active',
      lastAttended: '2025-07-13'
    },
    {
      id: '6',
      firstName: 'Lisa',
      lastName: 'Miller',
      membershipStatus: 'visitor'
    },
    {
      id: '7',
      firstName: 'James',
      lastName: 'Taylor',
      email: 'james.taylor@email.com',
      membershipStatus: 'active',
      lastAttended: '2025-07-20'
    }
  ];

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    // Use sample data if no members provided
    if (this.members.length === 0) {
      this.members = this.sampleMembers;
    }
    
    this.filteredMembers = [...this.members];
    this.totalMembers = this.members.length;
    
    // Initialize all members as absent by default
    this.members.forEach(member => {
      this.attendanceRecords.set(member.id, {
        memberId: member.id,
        status: 'absent'
      });
    });
    
    this.updateStatistics();
    this.setupSearch();
    this.initializeForms();
  }

  private initializeForms() {
    this.addGuestForm = new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl(''),
      phone: new FormControl('')
    });

    this.noteForm = new FormGroup({
      note: new FormControl('', [Validators.maxLength(500)])
    });
  }

  private setupSearch() {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      if (!searchTerm) {
        this.filteredMembers = [...this.members];
      } else {
        const term = searchTerm.toLowerCase();
        this.filteredMembers = this.members.filter(member => 
          member.firstName.toLowerCase().includes(term) ||
          member.lastName.toLowerCase().includes(term) ||
          member.email?.toLowerCase().includes(term)
        );
      }
    });
  }

  setAttendanceStatus(memberId: string, status: 'present' | 'absent' | 'late' | 'excused') {
    const record = this.attendanceRecords.get(memberId);
    if (record) {
      record.status = status;
      if (status === 'present' || status === 'late') {
        record.checkedInAt = new Date();
        record.checkedInBy = 'Current User'; // Replace with actual user
      }
      this.attendanceRecords.set(memberId, record);
      this.updateStatistics();
    }
  }

  async addNote(member: Member) {
    // Use the modern note modal instead of alert
    this.openNoteModal(member);
  }

  async markAllPresent() {
    // Use the modern confirmation modal instead of alert
    this.openMarkAllPresentModal();
  }

  async quickCheckIn() {
    // Use the modern quick check-in modal instead of alert
    this.openQuickCheckInModal();
  }

  async offerAddNewGuest(searchName: string) {
    // Instead of showing an alert, directly open the add guest modal with pre-populated name
    this.addNewGuest(searchName);
  }

  async addNewGuest(initialName?: string) {
    // Pre-populate the form with the search term if provided
    if (initialName) {
      const nameParts = initialName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      this.addGuestForm.patchValue({
        firstName,
        lastName
      });
    }
    
    // Use the modern add guest modal instead of alert
    this.openAddGuestModal();
  }

  private updateStatistics() {
    this.presentCount = 0;
    this.absentCount = 0;
    this.lateCount = 0;
    this.excusedCount = 0;

    this.attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'present': this.presentCount++; break;
        case 'absent': this.absentCount++; break;
        case 'late': this.lateCount++; break;
        case 'excused': this.excusedCount++; break;
      }
    });
  }

  getAttendanceStatusColor(status: string): string {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'excused': return 'tertiary';
      case 'absent': return 'danger';
      default: return 'medium';
    }
  }

  getAttendanceStatusIcon(status: string): string {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'late': return 'time';
      case 'excused': return 'information-circle';
      case 'absent': return 'close-circle';
      default: return 'help-circle';
    }
  }

  // Enhanced UI interaction methods
  
  triggerHapticFeedback(element?: HTMLElement) {
    // Add haptic feedback class for visual feedback
    if (element) {
      element.classList.add('haptic-feedback', 'active');
      setTimeout(() => {
        element.classList.remove('active');
      }, 600);
    }
  }

  triggerRippleEffect(event: MouseEvent, member: Member) {
    const target = event.currentTarget as HTMLElement;
    const memberItem = target.closest('.member-item') as HTMLElement;
    
    if (memberItem) {
      memberItem.classList.add('ripple-active');
      setTimeout(() => {
        memberItem.classList.remove('ripple-active');
      }, 600);
    }
  }

  // Enhanced attendance options with better feedback
  async presentAttendanceOptions(member: Member) {
    // Trigger haptic feedback
    this.triggerHapticFeedback();
    
    const currentStatus = this.attendanceRecords.get(member.id)?.status || 'absent';
    const currentNotes = this.attendanceRecords.get(member.id)?.notes;
    
    const actionSheet = await this.actionSheetController.create({
      header: `${member.firstName} ${member.lastName}`,
      subHeader: `Current: ${currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}${currentNotes ? ' • Has notes' : ''}`,
      cssClass: 'attendance-action-sheet',
      animated: true,
      buttons: [
        {
          text: 'Present',
          icon: 'checkmark-circle',
          cssClass: `action-present ${currentStatus === 'present' ? 'current-status' : ''}`,
          data: { status: 'present', color: 'success' },
          handler: () => {
            this.setAttendanceStatusWithFeedback(member.id, 'present', 'success');
          }
        },
        {
          text: 'Late',
          icon: 'time',
          cssClass: `action-late ${currentStatus === 'late' ? 'current-status' : ''}`,
          data: { status: 'late', color: 'warning' },
          handler: () => {
            this.setAttendanceStatusWithFeedback(member.id, 'late', 'warning');
          }
        },
        {
          text: 'Excused',
          icon: 'information-circle',
          cssClass: `action-excused ${currentStatus === 'excused' ? 'current-status' : ''}`,
          data: { status: 'excused', color: 'tertiary' },
          handler: () => {
            this.setAttendanceStatusWithFeedback(member.id, 'excused', 'tertiary');
          }
        },
        {
          text: 'Absent',
          icon: 'close-circle',
          cssClass: `action-absent ${currentStatus === 'absent' ? 'current-status' : ''}`,
          data: { status: 'absent', color: 'danger' },
          handler: () => {
            this.setAttendanceStatusWithFeedback(member.id, 'absent', 'danger');
          }
        },
        {
          text: currentNotes ? 'Edit Note' : 'Add Note',
          icon: currentNotes ? 'create' : 'add-circle',
          cssClass: `action-note ${currentNotes ? 'has-note' : ''}`,
          handler: () => this.openNoteModal(member)
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          cssClass: 'action-cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }

  // Enhanced status setting with better feedback
  private setAttendanceStatusWithFeedback(memberId: string, status: 'present' | 'absent' | 'late' | 'excused', toastColor: string) {
    this.setAttendanceStatus(memberId, status);
    const member = this.members.find(m => m.id === memberId);
    if (member) {
      this.presentEnhancedToast(`${member.firstName} marked as ${status.charAt(0).toUpperCase() + status.slice(1)}`, toastColor);
    }
  }

  // Enhanced note adding with animation
  private async addNoteWithAnimation(member: Member) {
    const currentRecord = this.attendanceRecords.get(member.id);
    const currentNotes = currentRecord?.notes || '';
    const maxLength = 500;

    const alert = await this.alertController.create({
      header: `${currentNotes ? 'Edit' : 'Add'} Note`,
      subHeader: `${member.firstName} ${member.lastName}`,
      message: currentNotes ? 'Current note:' : 'Add a note for this member:',
      cssClass: 'note-alert enhanced-note-alert',
      inputs: [
        {
          name: 'note',
          type: 'textarea',
          placeholder: 'Enter note here...',
          value: currentNotes,
          attributes: {
            maxlength: maxLength,
            rows: 4,
            'data-member-name': `${member.firstName} ${member.lastName}`
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-cancel-button'
        },
        {
          text: currentNotes ? 'Update' : 'Save',
          cssClass: 'alert-save-button loading-button',
          handler: (data) => {
            const noteText = data.note?.trim();
            if (noteText) {
              const record = this.attendanceRecords.get(member.id) || {
                memberId: member.id,
                status: 'absent'
              };
              record.notes = noteText;
              this.attendanceRecords.set(member.id, record);
              
              this.presentEnhancedToast(
                `📝 Note ${currentNotes ? 'updated' : 'added'} for ${member.firstName}`,
                'primary'
              );
            } else if (currentNotes) {
              // Remove note if empty
              const record = this.attendanceRecords.get(member.id);
              if (record) {
                delete record.notes;
                this.attendanceRecords.set(member.id, record);
                this.presentEnhancedToast(`Note removed for ${member.firstName}`, 'medium');
              }
            }
            return true;
          }
        }
      ]
    });

    await alert.present();
    
    // Add character counter functionality
    setTimeout(() => {
      const textarea = document.querySelector('.note-alert textarea') as HTMLTextAreaElement;
      if (textarea) {
        this.addCharacterCounter(textarea, maxLength);
      }
    }, 100);
  }

  // Character counter for textarea
  private addCharacterCounter(textarea: HTMLTextAreaElement, maxLength: number) {
    const wrapper = textarea.closest('.alert-input-wrapper');
    if (!wrapper) return;

    const counter = document.createElement('div');
    counter.className = 'character-counter';
    wrapper.appendChild(counter);

    const updateCounter = () => {
      const length = textarea.value.length;
      counter.textContent = `${length}/${maxLength}`;
      
      counter.classList.remove('near-limit', 'at-limit');
      if (length > maxLength * 0.8) {
        counter.classList.add('near-limit');
      }
      if (length >= maxLength) {
        counter.classList.add('at-limit');
      }
    };

    textarea.addEventListener('input', updateCounter);
    updateCounter();
  }

  // Enhanced toast with better animations
  private async presentEnhancedToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: `custom-toast toast-color-${color}`,
      animated: true,
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            toast.dismiss();
          }
        }
      ]
    });

    await toast.present();
    
    // Add enhanced animation classes
    setTimeout(() => {
      const toastElement = document.querySelector('.custom-toast');
      if (toastElement) {
        toastElement.classList.add('toast-entering');
      }
    }, 50);
  }

  // Enhanced member info display
  getMemberInitials(member: Member): string {
    return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
  }

  // Enhanced attendance percentage calculation
  getAttendancePercentage(): number {
    const attendedCount = this.presentCount + this.lateCount;
    const totalCount = this.totalMembers;
    return totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
  }

  // Enhanced statistics with trend analysis
  getAttendanceTrend(): 'up' | 'down' | 'stable' {
    const percentage = this.getAttendancePercentage();
    if (percentage >= 80) return 'up';
    if (percentage >= 60) return 'stable';
    return 'down';
  }

  // Enhanced save with loading state
  async saveAttendanceWithLoading() {
    const saveButton = document.querySelector('ion-button[fill="solid"]') as HTMLElement;
    if (saveButton) {
      saveButton.classList.add('loading-button');
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const attendanceData = Array.from(this.attendanceRecords.values());
      const newGuests = this.getNewGuests();
      
      this.presentEnhancedToast(
        `✅ Attendance saved for ${this.totalMembers} members${newGuests.length > 0 ? ` (${newGuests.length} new guests)` : ''}`,
        'success'
      );
      
      this.dismiss({
        attendance: attendanceData,
        newGuests: newGuests,
        statistics: {
          present: this.presentCount,
          late: this.lateCount,
          excused: this.excusedCount,
          absent: this.absentCount,
          percentage: this.getAttendancePercentage()
        }
      });
    } catch (error) {
      this.presentEnhancedToast('❌ Failed to save attendance. Please try again.', 'danger');
    } finally {
      if (saveButton) {
        saveButton.classList.remove('loading-button');
      }
    }
  }

  async saveAttendance() {
    this.isSaving = true;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Collect attendance data
      const attendanceData = Array.from(this.attendanceRecords.values());
      
      this.presentToast(`✅ Attendance saved for ${attendanceData.length} members!`, 'success');
      this.dismiss(attendanceData);
    } catch (error) {
      this.presentToast(`❌ Failed to save attendance. Please try again.`, 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  dismiss(data?: any) {
    this.closeFabMenu();
    this.modalController.dismiss(data);
  }

  private async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast',
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  trackByMemberId(index: number, member: Member): string {
    return member.id;
  }

  getNewGuests(): Member[] {
    return this.members.filter(member => member.id.startsWith('guest_'));
  }

  scrollToMember(memberId: string) {
    // Find the member element and scroll to it
    const memberElement = document.querySelector(`[data-member-id="${memberId}"]`);
    if (memberElement) {
      memberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect
      memberElement.classList.add('highlight-member');
      setTimeout(() => {
        memberElement.classList.remove('highlight-member');
      }, 2000);
    }
  }

  // FAB Menu Methods
  toggleFabMenu() {
    this.fabMenuOpen = !this.fabMenuOpen;
  }

  closeFabMenu() {
    this.fabMenuOpen = false;
  }

  // Modern Modal Methods
  
  openAddGuestModal() {
    this.addGuestForm.reset();
    this.showAddGuestModal = true;
  }
  
  closeAddGuestModal() {
    this.showAddGuestModal = false;
  }
  
  submitNewGuest() {
    if (this.addGuestForm.valid) {
      const formValue = this.addGuestForm.value;
      const newGuest: Member = {
        id: `guest_${Date.now()}`,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email || undefined,
        phone: formValue.phone || undefined,
        membershipStatus: 'visitor'
      };
      
      this.members.push(newGuest);
      this.filteredMembers = [...this.members];
      this.totalMembers = this.members.length;
      
      // Mark as present and add note
      this.attendanceRecords.set(newGuest.id, {
        memberId: newGuest.id,
        status: 'present',
        checkedInAt: new Date(),
        checkedInBy: 'Current User',
        notes: 'Added as new guest'
      });
      
      this.updateStatistics();
      this.closeAddGuestModal();
      this.presentToast(`🎉 ${newGuest.firstName} ${newGuest.lastName} added and checked in!`, 'success');
      
      // Scroll to the new guest
      setTimeout(() => {
        this.scrollToMember(newGuest.id);
      }, 100);
    }
  }
  
  openQuickCheckInModal() {
    this.quickCheckInSearch = '';
    this.quickCheckInResults = [];
    this.showQuickCheckInModal = true;
  }
  
  closeQuickCheckInModal() {
    this.showQuickCheckInModal = false;
  }
  
  filterMembersForQuickCheckIn() {
    if (!this.quickCheckInSearch.trim()) {
      this.quickCheckInResults = [];
      return;
    }
    
    const searchTerm = this.quickCheckInSearch.toLowerCase();
    this.quickCheckInResults = this.members
      .filter(member => 
        member.firstName.toLowerCase().includes(searchTerm) ||
        member.lastName.toLowerCase().includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5); // Limit to 5 results for better UX
    
    // If no results after typing 3+ characters, suggest adding as guest
    if (this.quickCheckInSearch.trim().length >= 3 && this.quickCheckInResults.length === 0) {
      // Show a toast suggestion after a delay
      setTimeout(() => {
        if (this.quickCheckInResults.length === 0 && this.quickCheckInSearch.trim().length >= 3) {
          this.presentToast(`No member found. Tap "Add New Guest" to add "${this.quickCheckInSearch.trim()}" as a guest.`, 'medium');
        }
      }, 1000);
    }
  }
  
  quickCheckInMember(member: Member) {
    this.setAttendanceStatus(member.id, 'present');
    this.closeQuickCheckInModal();
    this.presentToast(`✅ ${member.firstName} ${member.lastName} checked in!`, 'success');
    
    // Scroll to the member
    setTimeout(() => {
      this.scrollToMember(member.id);
    }, 100);
  }
  
  openNoteModal(member: Member) {
    const currentRecord = this.attendanceRecords.get(member.id);
    const currentNote = currentRecord?.notes || '';
    
    this.noteModalData = {
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      isEdit: !!currentNote
    };
    
    this.noteForm.patchValue({
      note: currentNote
    });
    
    this.showNoteModal = true;
  }
  
  closeNoteModal() {
    this.showNoteModal = false;
  }
  
  submitNote() {
    const noteValue = this.noteForm.get('note')?.value?.trim();
    const record = this.attendanceRecords.get(this.noteModalData.memberId);
    
    if (record) {
      if (noteValue) {
        record.notes = noteValue;
        this.presentToast(`📝 Note ${this.noteModalData.isEdit ? 'updated' : 'added'} for ${this.noteModalData.memberName}`, 'primary');
      } else {
        delete record.notes;
        this.presentToast(`🗑️ Note removed for ${this.noteModalData.memberName}`, 'warning');
      }
      this.attendanceRecords.set(this.noteModalData.memberId, record);
    }
    
    this.closeNoteModal();
  }
  
  removeNote() {
    const record = this.attendanceRecords.get(this.noteModalData.memberId);
    if (record) {
      delete record.notes;
      this.attendanceRecords.set(this.noteModalData.memberId, record);
      this.presentToast(`🗑️ Note removed for ${this.noteModalData.memberName}`, 'warning');
    }
    this.closeNoteModal();
  }

  openMarkAllPresentModal() {
    this.showMarkAllPresentModal = true;
  }
  
  closeMarkAllPresentModal() {
    this.showMarkAllPresentModal = false;
  }
  
  confirmMarkAllPresent() {
    this.members.forEach(member => {
      this.setAttendanceStatus(member.id, 'present');
    });
    this.closeMarkAllPresentModal();
    this.presentToast(`🎉 All ${this.totalMembers} members marked as present!`, 'success');
  }
}

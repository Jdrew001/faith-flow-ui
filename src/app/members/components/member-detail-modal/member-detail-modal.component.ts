import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { MembersService } from '../../services/members.service';
import { Member, MemberStatus, MemberNote } from '../../models';
import { MemberNoteModalComponent } from '../member-note-modal/member-note-modal.component';

@Component({
  selector: 'app-member-detail-modal',
  templateUrl: './member-detail-modal.component.html',
  styleUrls: ['./member-detail-modal.component.scss'],
  standalone: false
})
export class MemberDetailModalComponent implements OnInit {
  @Input() member!: Member;
  
  isEditing = false;
  memberForm!: FormGroup;
  activeTab = 'overview';
  memberNotes: MemberNote[] = [];
  filteredNotes: MemberNote[] = [];
  noteSearchTerm = '';
  selectedCategory = 'All';
  noteSortOrder: 'asc' | 'desc' = 'desc';
  expandedNoteId: string | null = null;
  
  noteCategoryOptions = [
    { value: 'All', label: 'All Categories', icon: 'apps-outline' },
    { value: 'General', label: 'General', icon: 'document-outline' },
    { value: 'Follow-up', label: 'Follow-up', icon: 'flag-outline' },
    { value: 'Prayer Request', label: 'Prayer Request', icon: 'heart-outline' }
  ];
  
  // Related data
  attendanceHistory: any[] = [];
  followUps: any[] = [];
  workflows: any[] = [];
  
  // Available options
  statusOptions = Object.values(MemberStatus);
  
  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private membersService: MembersService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadRelatedData();
  }
  
  // Notes UI Methods
  getRecentNotesCount(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return this.memberNotes.filter(note => 
      new Date(note.created_at) > oneMonthAgo
    ).length;
  }
  
  isRecentNote(date: string): boolean {
    const noteDate = new Date(date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return noteDate > weekAgo;
  }
  
  wasUpdated(note: MemberNote): boolean {
    if (!note.updated_at || !note.created_at) return false;
    // Check if updated_at is significantly different from created_at (more than 1 minute)
    const created = new Date(note.created_at).getTime();
    const updated = new Date(note.updated_at).getTime();
    return (updated - created) > 60000; // 1 minute in milliseconds
  }
  
  filterNotes() {
    let filtered = [...this.memberNotes];
    
    // Filter by search term
    if (this.noteSearchTerm) {
      const searchLower = this.noteSearchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(searchLower) ||
        note.category?.toLowerCase().includes(searchLower) ||
        note.author?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(note => 
        note.category === this.selectedCategory ||
        (!note.category && this.selectedCategory === 'General')
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return this.noteSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    this.filteredNotes = filtered;
  }
  
  onCategoryChange(value: string) {
    this.selectedCategory = value;
    this.filterNotes();
  }
  
  toggleNoteSort() {
    this.noteSortOrder = this.noteSortOrder === 'desc' ? 'asc' : 'desc';
    this.filterNotes();
  }
  
  isNoteExpanded(note: MemberNote): boolean {
    return this.expandedNoteId === note.id;
  }
  
  toggleNoteExpansion(note: MemberNote) {
    this.expandedNoteId = this.expandedNoteId === note.id ? null : note.id;
  }
  
  getTruncatedContent(note: MemberNote): string {
    if (this.isNoteExpanded(note) || note.content.length <= 150) {
      return note.content;
    }
    return note.content.substring(0, 150) + '...';
  }
  
  async showNoteOptions(note: MemberNote, event: Event) {
    event.stopPropagation();
    
    const alert = await this.alertController.create({
      header: 'Note Options',
      cssClass: 'note-options-alert',
      buttons: [
        {
          text: 'Edit',
          handler: () => {
            this.editNote(note);
          }
        },
        {
          text: 'Copy',
          handler: () => {
            this.copyNote(note);
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          cssClass: 'danger',
          handler: () => {
            this.deleteNote(note);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }
  
  async editNote(note: MemberNote) {
    // TODO: Implement edit note functionality
    await this.showToast('Edit feature coming soon', 'warning');
  }
  
  async copyNote(note: MemberNote) {
    try {
      await navigator.clipboard.writeText(note.content);
      await this.showToast('Note copied to clipboard', 'success');
    } catch (error) {
      await this.showToast('Failed to copy note', 'danger');
    }
  }
  
  // UI Helper Methods
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  getAvatarGradient(name: string): string {
    const colors = [
      ['#007aff', '#5856d6'],
      ['#34c759', '#30d158'],
      ['#ff9500', '#ff6200'],
      ['#ff3b30', '#ff6482'],
      ['#5856d6', '#007aff'],
      ['#af52de', '#5856d6'],
      ['#ff6482', '#ff3b30'],
      ['#ffcc00', '#ff9500']
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const [color1, color2] = colors[index];
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }
  
  getStatusColor(status: MemberStatus): string {
    switch (status) {
      case MemberStatus.ACTIVE:
        return 'success';
      case MemberStatus.INACTIVE:
        return 'warning';
      case MemberStatus.VISITOR:
        return 'primary';
      default:
        return 'medium';
    }
  }
  
  formatPhone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
  
  getFullAddress(): string {
    const parts = [];
    if (this.member.address) parts.push(this.member.address);
    if (this.member.city) parts.push(this.member.city);
    if (this.member.state) parts.push(this.member.state);
    if (this.member.zip) parts.push(this.member.zip);
    return parts.join(', ');
  }
  
  getAttendanceCount(status: string): number {
    return this.attendanceHistory.filter(a => a.status === status).length;
  }
  
  getAttendanceRate(): number {
    if (this.attendanceHistory.length === 0) return 0;
    const present = this.getAttendanceCount('Present');
    return Math.round((present / this.attendanceHistory.length) * 100);
  }
  
  // Action Methods
  async callMember() {
    if (this.member.phone) {
      window.location.href = `tel:${this.member.phone}`;
    }
  }
  
  async emailMember() {
    if (this.member.email) {
      window.location.href = `mailto:${this.member.email}`;
    }
  }
  
  async sendMessage() {
    await this.showToast('Messaging feature coming soon', 'warning');
  }
  
  async addFollowUp() {
    await this.showToast('Follow-up feature coming soon', 'warning');
  }
  
  async addNote() {
    const modal = await this.modalController.create({
      component: MemberNoteModalComponent,
      componentProps: {
        memberId: this.member.id,
        memberName: this.member.name
      },
      cssClass: 'member-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.note) {
        this.memberNotes.unshift(result.data.note);
        this.filterNotes();
      }
    });

    return await modal.present();
  }
  
  async deleteNote(note: MemberNote) {
    try {
      await this.membersService.deleteMemberNote(this.member.id, note.id).toPromise();
      
      const index = this.memberNotes.findIndex(n => n.id === note.id);
      if (index > -1) {
        this.memberNotes.splice(index, 1);
        // Update the filtered notes to reflect the deletion
        this.filterNotes();
      }
      
      await this.showToast('Note deleted', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      await this.showToast('Failed to delete note', 'danger');
    }
  }
  
  async openActions() {
    const actionSheet = await this.alertController.create({
      header: 'Member Actions',
      buttons: [
        {
          text: 'Archive Member',
          role: 'destructive',
          handler: () => {
            this.archive();
          }
        },
        {
          text: 'Export Data',
          handler: () => {
            this.showToast('Export feature coming soon', 'warning');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  initForm() {
    this.memberForm = this.formBuilder.group({
      name: [this.member.name, Validators.required],
      email: [this.member.email, Validators.email],
      phone: [this.member.phone],
      address: [this.member.address],
      city: [this.member.city],
      state: [this.member.state],
      zip: [this.member.zip],
      birthdate: [this.member.birthdate],
      anniversary: [this.member.anniversary],
      status: [this.member.status, Validators.required],
      membership_date: [this.member.membership_date],
      notes: [this.member.notes]
    });
  }

  async loadRelatedData() {
    // Load attendance history
    this.membersService.getMemberAttendance(this.member.id, 20).subscribe(
      data => this.attendanceHistory = data,
      error => console.error('Error loading attendance:', error)
    );
    
    // Load follow-ups
    this.membersService.getMemberFollowUps(this.member.id).subscribe(
      data => this.followUps = data,
      error => console.error('Error loading follow-ups:', error)
    );
    
    // Load workflows
    this.membersService.getMemberWorkflows(this.member.id).subscribe(
      data => this.workflows = data,
      error => console.error('Error loading workflows:', error)
    );
    
    // Load member notes
    this.membersService.getMemberNotes(this.member.id).subscribe(
      data => {
        this.memberNotes = data;
        this.filterNotes();
      },
      error => console.error('Error loading notes:', error)
    );
    
    // Load member statistics
    this.membersService.getMemberStatistics(this.member.id).subscribe(
      stats => {
        // Update member with stats if needed
        console.log('Member stats:', stats);
      },
      error => console.error('Error loading stats:', error)
    );
    
    // Load member activity
    this.membersService.getMemberActivity(this.member.id, 10).subscribe(
      activities => {
        console.log('Member activities:', activities);
      },
      error => console.error('Error loading activity:', error)
    );
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initForm(); // Reset form to original values
    }
  }

  async save() {
    if (this.memberForm.invalid) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    // Validate at least one contact method
    const email = this.memberForm.get('email')?.value?.trim();
    const phone = this.memberForm.get('phone')?.value?.trim();
    
    if (!email && !phone) {
      await this.showToast('Please provide at least one contact method (email or phone)', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving member...'
    });
    await loading.present();

    try {
      const formValue = this.memberForm.value;
      
      // Clean up date fields - convert empty strings to null
      const memberData = {
        ...formValue,
        birthdate: formValue.birthdate || null,
        anniversary: formValue.anniversary || null,
        membership_date: formValue.membership_date || null
      };
      
      const updatedMember = await this.membersService.updateMember(
        this.member.id,
        memberData
      ).toPromise();
      
      this.member = updatedMember!;
      this.isEditing = false;
      await this.showToast('Member updated successfully', 'success');
      
      await this.modalController.dismiss({
        updated: true,
        member: updatedMember
      });
    } catch (error) {
      console.error('Error updating member:', error);
      await this.showToast('Failed to update member', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async archive() {
    const alert = await this.alertController.create({
      header: 'Archive Member',
      message: `Are you sure you want to archive ${this.member.name}? This member can be restored later.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Archive',
          cssClass: 'danger',
          handler: async () => {
            await this.performArchive();
          }
        }
      ]
    });
    await alert.present();
  }

  async performArchive() {
    const loading = await this.loadingController.create({
      message: 'Archiving member...'
    });
    await loading.present();

    try {
      await this.membersService.archiveMember(this.member.id).toPromise();
      await this.showToast('Member archived successfully', 'success');
      
      await this.modalController.dismiss({
        archived: true
      });
    } catch (error) {
      console.error('Error archiving member:', error);
      await this.showToast('Failed to archive member', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async addTag() {
    const alert = await this.alertController.create({
      header: 'Add Tag',
      inputs: [
        {
          name: 'tag',
          type: 'text',
          placeholder: 'Enter tag name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (data) => {
            if (data.tag) {
              await this.performAddTag(data.tag);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async performAddTag(tag: string) {
    try {
      const updatedMember = await this.membersService.addTag(this.member.id, tag).toPromise();
      if (updatedMember) {
        this.member = updatedMember;
        // Update the form if in edit mode
        if (this.memberForm) {
          this.memberForm.patchValue({ tags: this.member.tags });
        }
      }
      await this.showToast('Tag added successfully', 'success');
    } catch (error) {
      console.error('Error adding tag:', error);
      await this.showToast('Failed to add tag', 'danger');
    }
  }

  async removeTag(tag: string) {
    try {
      const updatedMember = await this.membersService.removeTag(this.member.id, tag).toPromise();
      if (updatedMember) {
        this.member = updatedMember;
        // Update the form if in edit mode
        if (this.memberForm) {
          this.memberForm.patchValue({ tags: this.member.tags });
        }
      }
      await this.showToast('Tag removed successfully', 'success');
    } catch (error) {
      console.error('Error removing tag:', error);
      await this.showToast('Failed to remove tag', 'danger');
    }
  }

  close() {
    this.modalController.dismiss();
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  }

  getAge(): number | null {
    if (!this.member.birthdate) return null;
    const today = new Date();
    const birthDate = new Date(this.member.birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
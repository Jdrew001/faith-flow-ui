import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MembersService } from './services/members.service';
import { Member, MemberStatus, MemberFilters } from './models';
import { MemberDetailModalComponent } from './components/member-detail-modal/member-detail-modal.component';
import { MemberCreateModalComponent } from './components/member-create-modal/member-create-modal.component';

@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
  standalone: false
})
export class MembersPage implements OnInit, OnDestroy {
  members: Member[] = [];
  filteredMembers: Member[] = [];
  isLoading = false;
  searchControl = new FormControl('');
  selectedStatus: MemberStatus | 'all' = 'all';
  selectedTags: string[] = [];
  availableTags: string[] = [];
  
  // Expose enum to template
  MemberStatus = MemberStatus;
  
  // UI State
  viewMode: 'list' | 'grid' = 'list';
  showFilterMenu = false;
  showSortMenu = false;
  sortField: 'name' | 'created' | 'lastActive' | 'status' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Stats
  stats = {
    total: 0,
    active: 0,
    inactive: 0,
    visitors: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private membersService: MembersService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadMembers();
    this.setupSearch();
    
    // Subscribe to members updates
    this.membersService.members$
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.members = members;
        this.applyFilters();
        this.updateStats();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadMembers() {
    this.isLoading = true;
    try {
      const members = await this.membersService.getMembers().toPromise();
      if (members) {
        this.members = members;
        this.applyFilters();
        this.updateStats();
      }
    } catch (error) {
      console.error('Error loading members:', error);
      await this.showToast('Failed to load members', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.applyFilters();
      });
  }

  applyFilters() {
    let filtered = [...this.members];
    
    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === this.selectedStatus);
    }
    
    // Filter by search term
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm) ||
        m.email?.toLowerCase().includes(searchTerm) ||
        m.phone?.includes(searchTerm)
      );
    }
    
    // Filter by tags
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(m => 
        m.tags?.some(tag => this.selectedTags.includes(tag))
      );
    }
    
    this.filteredMembers = filtered;
    this.applySorting();
  }

  updateStats() {
    this.stats = {
      total: this.members.length,
      active: this.members.filter(m => m.status === MemberStatus.ACTIVE).length,
      inactive: this.members.filter(m => m.status === MemberStatus.INACTIVE).length,
      visitors: this.members.filter(m => m.status === MemberStatus.VISITOR).length
    };
    
    // Extract unique tags
    const tags = new Set<string>();
    this.members.forEach(m => {
      m.tags?.forEach(tag => tags.add(tag));
    });
    this.availableTags = Array.from(tags).sort();
  }

  onStatusChange() {
    this.applyFilters();
  }

  onTagChange(event: any) {
    this.selectedTags = event.detail.value;
    this.applyFilters();
  }

  async openCreateModal() {
    const modal = await this.modalController.create({
      component: MemberCreateModalComponent,
      cssClass: 'member-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.created) {
        this.showToast('Member created successfully', 'success');
        this.loadMembers();
      }
    });

    return await modal.present();
  }

  async openMember(member: Member) {
    const modal = await this.modalController.create({
      component: MemberDetailModalComponent,
      componentProps: {
        member: member
      },
      cssClass: 'member-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.updated) {
        this.showToast('Member updated successfully', 'success');
        this.loadMembers();
      } else if (result.data?.archived) {
        this.showToast('Member archived successfully', 'success');
        this.loadMembers();
      }
    });

    return await modal.present();
  }

  async archiveMember(member: Member, event: Event) {
    event.stopPropagation();
    
    const alert = await this.alertController.create({
      header: 'Archive Member',
      message: `Are you sure you want to archive ${member.name}? This member can be restored later.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Archive',
          cssClass: 'danger',
          handler: async () => {
            await this.performArchive(member);
          }
        }
      ]
    });

    await alert.present();
  }

  async performArchive(member: Member) {
    const loading = await this.loadingController.create({
      message: 'Archiving member...'
    });
    await loading.present();

    try {
      await this.membersService.archiveMember(member.id).toPromise();
      await this.showToast('Member archived successfully', 'success');
      await this.loadMembers();
    } catch (error) {
      console.error('Error archiving member:', error);
      await this.showToast('Failed to archive member', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async doRefresh(event: any) {
    await this.loadMembers();
    event.target.complete();
  }

  getStatusColor(status: MemberStatus): string {
    switch (status) {
      case MemberStatus.ACTIVE:
        return 'success';
      case MemberStatus.INACTIVE:
        return 'warning';
      case MemberStatus.VISITOR:
        return 'primary';
      case MemberStatus.ARCHIVED:
        return 'medium';
      default:
        return 'medium';
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarGradient(name: string): string {
    // Generate a gradient based on the name for consistent colors
    const colors = [
      ['#818cf8', '#6366f1'],
      ['#34d399', '#10b981'],
      ['#fbbf24', '#f59e0b'],
      ['#60a5fa', '#3b82f6'],
      ['#f87171', '#ef4444'],
      ['#a78bfa', '#8b5cf6'],
      ['#fb923c', '#ea580c'],
      ['#94a3b8', '#64748b']
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const [color1, color2] = colors[index];
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  clearFilters() {
    this.selectedStatus = 'all';
    this.selectedTags = [];
    this.searchControl.setValue('');
    this.applyFilters();
  }

  sortBy(field: 'name' | 'created' | 'lastActive' | 'status') {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.applySorting();
  }

  applySorting() {
    this.filteredMembers.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'created':
          compareValue = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'lastActive':
          compareValue = new Date(a.lastAttendance || 0).getTime() - new Date(b.lastAttendance || 0).getTime();
          break;
        case 'status':
          compareValue = (a.status || '').localeCompare(b.status || '');
          break;
      }
      
      return this.sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }

  async showMemberActions(member: Member, event: Event) {
    event.stopPropagation();
    
    const alert = await this.alertController.create({
      header: 'Member Actions',
      cssClass: 'member-actions-alert',
      buttons: [
        {
          text: 'View Details',
          handler: () => {
            this.openMember(member);
          }
        },
        {
          text: 'Send Message',
          handler: () => {
            // TODO: Implement messaging
            this.showToast('Messaging coming soon', 'warning');
          }
        },
        {
          text: 'Add Note',
          handler: () => {
            // TODO: Implement notes
            this.showToast('Notes coming soon', 'warning');
          }
        },
        {
          text: 'Archive',
          cssClass: 'danger',
          handler: () => {
            this.performArchive(member);
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
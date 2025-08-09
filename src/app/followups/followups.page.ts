import { Component, OnInit } from '@angular/core';
import { NavController, MenuController, ViewDidEnter, ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AssignmentForm } from './components/assignment-modal/assignment-modal.component';
import { Assignee } from '../services/assignee.service';
import { FollowupModalComponent } from './components/followup-modal/followup-modal.component';
import { FollowupService } from './services/followup.service';
import { FollowupDto, FollowupFilters } from './models/followup.model';
import { AssigneeService } from '../services/assignee.service';
import { convertUTCToLocalDate, convertLocalToUTC } from '../shared/utils/date-timezone.util';

export interface FollowUpItem {
  id: string;
  personName: string;
  title: string;
  description: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  createdDate: Date;
  dueDate?: Date;
  notes?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

@Component({
  selector: 'app-followups',
  templateUrl: './followups.page.html',
  styleUrls: ['./followups.page.scss'],
  standalone: false
})
export class FollowupsPage implements ViewDidEnter {
  followups: FollowUpItem[] = [];
  filteredFollowups: FollowUpItem[] = [];
  showBackButton: boolean = false; // Control back button visibility
  isLoading: boolean = false;
  
  // Filter and sort options
  selectedPriority: string = 'all';
  selectedStatus: string = 'all';
  selectedAssignee: string = 'all';
  sortBy: string = 'dueDate';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchTerm: string = '';
  showFilterModal: boolean = false;
  showAssignModal: boolean = false;
  selectedFollowupForAssign: FollowUpItem | null = null;
  headerHidden = false;

  // Available filter options
  priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'LOW', label: 'Low Priority' }
  ];

  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  assignees: Assignee[] = [
    { value: 'all', label: 'All Assignees' },
    { value: 'unassigned', label: 'Unassigned' }
  ];

  sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'createdDate', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' }
  ];

  constructor(
    private navCtrl: NavController,
    private menuCtrl: MenuController,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private followupService: FollowupService,
    private assigneeService: AssigneeService
  ) { }

  ionViewDidEnter() {
    // Always close the menu when navigating to this page
    this.menuCtrl.close();
    
    // Check if we should show the back button based on navigation source
    this.route.queryParams.subscribe(params => {
      this.showBackButton = params['fromSummary'] === 'true';
    });
    
    // Load assignees from backend
    this.loadAssignees();
    
    this.loadFollowups();
  }

  async loadAssignees() {
    try {
      const fetchedAssignees = await this.assigneeService.getAssignees();
      
      // Merge with static filter options
      this.assignees = [
        { value: 'all', label: 'All Assignees' },
        ...fetchedAssignees,
        { value: 'unassigned', label: 'Unassigned' }
      ];
    } catch (error) {
      console.error('Error loading assignees:', error);
      // Keep existing assignees as fallback
    }
  }

  async loadFollowups() {
    this.isLoading = true;
    try {
      const filters: FollowupFilters = {
        status: this.selectedStatus === 'all' ? undefined : this.selectedStatus as any,
        priority: this.selectedPriority === 'all' ? undefined : this.selectedPriority as any,
        assignee: this.selectedAssignee === 'all' ? undefined : this.selectedAssignee,
        search: this.searchTerm.trim() || undefined,
        sortBy: this.sortBy as any,
        sortDirection: this.sortDirection
      };

      const response = await this.followupService.getFollowups(filters);
      
      // Convert FollowupDto to FollowUpItem format for compatibility
      this.followups = response.followups.map(dto => ({
          id: dto.id!,
          personName: dto.personName,
          title: dto.title,
          description: dto.description || '',
          type: dto.type,
          priority: dto.priority,
          status: dto.status,
          assignedTo: dto.assignedTo,
          createdDate: dto.createdDate ? new Date(dto.createdDate) : new Date(),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          notes: dto.notes,
          contactInfo: dto.contactInfo
      }));

      this.filterFollowups();
    } catch (error) {
      console.error('Error loading followups:', error);
      // You might want to show a toast or alert here
    } finally {
      this.isLoading = false;
    }
  }

  filterFollowups() {
    let filtered = [...this.followups];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const query = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.personName.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === this.selectedPriority);
    }

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    // Apply assignee filter
    if (this.selectedAssignee !== 'all') {
      if (this.selectedAssignee === 'Unassigned') {
        filtered = filtered.filter(item => !item.assignedTo);
      } else {
        filtered = filtered.filter(item => item.assignedTo === this.selectedAssignee);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { 'OPEN': 3, 'IN_PROGRESS': 2, 'COMPLETED': 1 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'dueDate':
          aValue = a.dueDate?.getTime() || 0;
          bValue = b.dueDate?.getTime() || 0;
          break;
        case 'createdDate':
          aValue = a.createdDate.getTime();
          bValue = b.createdDate.getTime();
          break;
        case 'name':
          aValue = a.personName.toLowerCase();
          bValue = b.personName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredFollowups = filtered;
  }

  sortFollowups() {
    this.filterFollowups();
  }

  hasActiveFilters(): boolean {
    return this.selectedStatus !== 'all' || 
           this.selectedPriority !== 'all' || 
           this.selectedAssignee !== 'all';
  }

  clearStatusFilter() {
    this.selectedStatus = 'all';
    this.filterFollowups();
  }

  clearPriorityFilter() {
    this.selectedPriority = 'all';
    this.filterFollowups();
  }

  clearAssigneeFilter() {
    this.selectedAssignee = 'all';
    this.filterFollowups();
  }

  clearAllFilters() {
    this.selectedStatus = 'all';
    this.selectedPriority = 'all';
    this.selectedAssignee = 'all';
    this.searchTerm = '';
    this.filterFollowups();
  }

  async markAsComplete(followUp: FollowUpItem) {
    try {
      await this.followupService.updateStatus(followUp.id, 'COMPLETED');
      followUp.status = 'COMPLETED';
      this.filterFollowups();
    } catch (error) {
      console.error('Error marking followup as complete:', error);
    }
  }

  async markAsInProgress(followUp: FollowUpItem) {
    try {
      await this.followupService.updateStatus(followUp.id, 'IN_PROGRESS');
      followUp.status = 'IN_PROGRESS';
      this.filterFollowups();
    } catch (error) {
      console.error('Error marking followup as in progress:', error);
    }
  }

  editFollowup(followUp: FollowUpItem) {
    // TODO: Navigate to edit page or open modal
    console.log('Edit follow-up:', followUp);
  }

  assignFollowup(followUp: FollowUpItem) {
    this.selectedFollowupForAssign = followUp;
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedFollowupForAssign = null;
  }

  async saveAssignment(assignmentForm: AssignmentForm) {
    if (!this.selectedFollowupForAssign) return;

    try {
      const assignment = {
        followupId: this.selectedFollowupForAssign.id,
        assignedTo: assignmentForm.assignedTo,
        priority: assignmentForm.priority as 'HIGH' | 'MEDIUM' | 'LOW',
        dueDate: assignmentForm.dueDate,  // Enhanced date picker now handles timezone conversion
        notes: assignmentForm.notes
      };

      await this.followupService.assignFollowup(assignment);

      // Update local data
      this.selectedFollowupForAssign.assignedTo = assignmentForm.assignedTo;
      this.selectedFollowupForAssign.notes = assignmentForm.notes;
      this.selectedFollowupForAssign.priority = assignmentForm.priority as 'HIGH' | 'MEDIUM' | 'LOW';
      
      if (assignmentForm.dueDate) {
        this.selectedFollowupForAssign.dueDate = new Date(assignmentForm.dueDate);
      }

      this.filterFollowups();
      this.closeAssignModal();

      console.log('Follow-up successfully assigned!');
    } catch (error) {
      console.error('Error assigning followup:', error);
      // Show error message - you could implement a toast here
    }
  }

  getAssigneeDetails(assigneeName: string): Assignee | null {
    return this.assignees.find(a => a.value === assigneeName) || null;
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'medium';
      default: return 'medium';
    }
  }

  getAssigneeName(assigneeId: string): string {
    const assignee = this.assignees.find(a => a.value === assigneeId);
    return assignee ? assignee.label : 'Unassigned';
  }

  getTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'new visitor follow-up':
        return 'person-add-outline';
      case 'prayer request follow-up':
        return 'heart-outline';
      case 'pastoral care':
        return 'medical-outline';
      case 'volunteer follow-up':
        return 'people-outline';
      default:
        return 'chatbubble-outline';
    }
  }

  isOverdue(dueDate: Date | string | undefined): boolean {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = convertUTCToLocalDate(dueDate);
    if (!due) return false;
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  isDueToday(dueDate: Date | string | undefined): boolean {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = convertUTCToLocalDate(dueDate);
    if (!due) return false;
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }

  addNewFollowup() {
    // Open create modal
    this.createNewFollowup();
  }

  goBack() {
    this.navCtrl.back();
  }
  
  // New methods for the redesigned UI
  refreshData() {
    this.loadFollowups();
  }

  doRefresh(event: any) {
    this.loadFollowups();
    // Complete the refresher after data is loaded
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
  
  onHeaderVisibilityChange(isHidden: boolean) {
    this.headerHidden = isHidden;
  }
  
  getTotalCount(): number {
    return this.followups.length;
  }
  
  getPendingCount(): number {
    return this.followups.filter(f => f.status === 'OPEN').length;
  }
  
  getOverdueCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.followups.filter(f => {
      if (!f.dueDate || f.status === 'COMPLETED') return false;
      const due = new Date(f.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
  }
  
  getCompletedCount(): number {
    return this.followups.filter(f => f.status === 'COMPLETED').length;
  }
  
  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.filterFollowups();
  }
  
  setPriority(priority: string) {
    this.selectedPriority = priority;
    this.filterFollowups();
  }
  
  trackByFollowupId(index: number, item: FollowUpItem): string {
    return item.id;
  }
  
  openFollowupDetail(followup: FollowUpItem) {
    // Open edit modal when clicking on card - this calls backend to get latest data
    this.openEditModal(followup);
  }
  
  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return name.charAt(0);
  }
  
  formatDueDate(date: Date | undefined): string {
    if (!date) return 'No due date';
    
    const today = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  
  async toggleComplete(followup: FollowUpItem) {
    try {
      const newStatus = followup.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
      await this.followupService.updateStatus(followup.id, newStatus);
      followup.status = newStatus;
      this.filterFollowups();
    } catch (error) {
      console.error('Error toggling followup status:', error);
    }
  }
  
  openAssignModal(followup: FollowUpItem) {
    this.selectedFollowupForAssign = followup;
    this.showAssignModal = true;
  }
  
  async openEditModal(followup: FollowUpItem) {
    const modal = await this.modalController.create({
      component: FollowupModalComponent,
      componentProps: {
        followupId: followup.id, // Pass ID instead of full object
        assignees: this.assignees
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.followup) {
      // Refresh the followups list to get updated data
      await this.loadFollowups();
    }
  }
  
  async createNewFollowup() {
    const modal = await this.modalController.create({
      component: FollowupModalComponent,
      componentProps: {
        followupId: null, // No ID means create new
        assignees: this.assignees
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.followup) {
      // Refresh the followups list to get updated data
      await this.loadFollowups();
    }
  }
  
  getAssigneesList(): Assignee[] {
    return this.assignees.filter(a => a.value !== 'all' && a.value !== 'unassigned');
  }
  
  getEmptyStateTitle(): string {
    if (this.searchTerm || this.hasActiveFilters()) {
      return 'No matching follow-ups';
    }
    return 'All caught up!';
  }
  
  getEmptyStateMessage(): string {
    if (this.searchTerm || this.hasActiveFilters()) {
      return 'Try adjusting your search or filters';
    }
    return 'Great work! No follow-ups pending.';
  }
}

import { Component, OnInit } from '@angular/core';
import { NavController, MenuController, ViewDidEnter } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AssignmentForm, Assignee } from './components/assignment-modal.component';

export interface FollowUpItem {
  id: string;
  personName: string;
  title: string;
  description: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
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
  showCreateModal: boolean = false;
  selectedFollowupForAssign: FollowUpItem | null = null;
  editingFollowup: FollowUpItem | null = null;
  headerHidden = false;
  
  // Form data
  followupForm = {
    personName: '',
    title: '',
    description: '',
    type: 'New Visitor Follow-up',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    assignedTo: '',
    dueDate: '',
    contactInfo: {
      phone: '',
      email: ''
    }
  };

  // Available filter options
  priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  assignees: Assignee[] = [
    { value: 'all', label: 'All Assignees' },
    { value: 'Pastor John', label: 'Pastor John', role: 'Lead Pastor', avatar: 'PJ', color: 'primary' },
    { value: 'Sarah Wilson', label: 'Sarah Wilson', role: 'Care Pastor', avatar: 'SW', color: 'secondary' },
    { value: 'Mike Johnson', label: 'Mike Johnson', role: 'Youth Pastor', avatar: 'MJ', color: 'tertiary' },
    { value: 'Lisa Chen', label: 'Lisa Chen', role: 'Admin', avatar: 'LC', color: 'success' },
    { value: 'David Brown', label: 'David Brown', role: 'Volunteer Coordinator', avatar: 'DB', color: 'warning' },
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
    private route: ActivatedRoute
  ) { }

  ionViewDidEnter() {
    // Always close the menu when navigating to this page
    this.menuCtrl.close();
    
    // Check if we should show the back button based on navigation source
    this.route.queryParams.subscribe(params => {
      this.showBackButton = params['fromSummary'] === 'true';
    });
    
    this.loadFollowups();
  }

  loadFollowups() {
    this.isLoading = true;
    // TODO: Replace with actual service call
    setTimeout(() => {
      this.followups = [
      {
        id: '1',
        personName: 'Sarah Johnson',
        title: 'Welcome New Visitor',
        description: 'First-time visitor, expressed interest in small groups',
        type: 'New Visitor Follow-up',
        priority: 'high',
        status: 'pending',
        assignedTo: 'Pastor John',
        createdDate: new Date('2025-07-15'),
        dueDate: new Date('2025-07-22'),
        notes: 'First-time visitor, expressed interest in small groups',
        contactInfo: {
          phone: '(555) 123-4567',
          email: 'sarah.j@email.com'
        }
      },
      {
        id: '2',
        personName: 'Mike Rodriguez',
        title: 'Prayer Request Follow-up',
        description: 'Check on family situation and job search',
        type: 'Prayer Request Follow-up',
        priority: 'medium',
        status: 'in-progress',
        assignedTo: 'Sarah Wilson',
        createdDate: new Date('2025-07-10'),
        dueDate: new Date('2025-07-24'),
        notes: 'Family going through difficult time, pray for job opportunity',
        contactInfo: {
          phone: '(555) 234-5678',
          email: 'mike.r@email.com'
        }
      },
      {
        id: '3',
        personName: 'Lisa Chen',
        title: 'Pastoral Care Visit',
        description: 'Hospital visit for surgery recovery',
        type: 'Pastoral Care',
        priority: 'high',
        status: 'pending',
        assignedTo: 'Pastor John',
        createdDate: new Date('2025-07-18'),
        dueDate: new Date('2025-07-21'),
        contactInfo: {
          phone: '(555) 345-6789',
          email: 'lisa.c@email.com'
        }
      },
      {
        id: '4',
        personName: 'David Thompson',
        title: 'Volunteer Follow-up',
        description: 'Interested in joining worship team',
        type: 'Volunteer Follow-up',
        priority: 'low',
        status: 'completed',
        assignedTo: 'Mike Johnson',
        createdDate: new Date('2025-07-12'),
        dueDate: new Date('2025-07-19'),
        contactInfo: {
          phone: '(555) 456-7890',
          email: 'david.t@email.com'
        }
      },
      {
        id: '5',
        personName: 'Maria Garcia',
        title: 'Baptism Follow-up',
        description: 'Recent baptism, connect with small group',
        type: 'New Member Follow-up',
        priority: 'medium',
        status: 'pending',
        createdDate: new Date('2025-07-16'),
        dueDate: new Date('2025-07-23'),
        contactInfo: {
          phone: '(555) 456-7890',
          email: 'maria.g@email.com'
        }
      }
      ];

      this.filterFollowups();
      this.isLoading = false;
    }, 1000);
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
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { 'pending': 3, 'in-progress': 2, 'completed': 1 };
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

  markAsComplete(followUp: FollowUpItem) {
    followUp.status = 'completed';
    this.filterFollowups();
    // TODO: Call service to update backend
  }

  markAsInProgress(followUp: FollowUpItem) {
    followUp.status = 'in-progress';
    this.filterFollowups();
    // TODO: Call service to update backend
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

  saveAssignment(assignmentForm: AssignmentForm) {
    if (!this.selectedFollowupForAssign) return;

    // Update the follow-up item
    this.selectedFollowupForAssign.assignedTo = assignmentForm.assignedTo;
    this.selectedFollowupForAssign.notes = assignmentForm.notes;
    this.selectedFollowupForAssign.priority = assignmentForm.priority as 'high' | 'medium' | 'low';
    
    if (assignmentForm.dueDate) {
      this.selectedFollowupForAssign.dueDate = new Date(assignmentForm.dueDate);
    }

    // TODO: Call service to update backend
    console.log('Assignment saved:', {
      followUp: this.selectedFollowupForAssign,
      assignment: assignmentForm
    });

    this.filterFollowups();
    this.closeAssignModal();

    // Show success message (you can implement toast here)
    console.log('Follow-up successfully assigned!');
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

  isOverdue(dueDate: Date | undefined): boolean {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  addNewFollowup() {
    // TODO: Navigate to create follow-up page or open modal
    console.log('Add new follow-up');
  }

  goBack() {
    this.navCtrl.back();
  }
  
  // New methods for the redesigned UI
  refreshData() {
    this.loadFollowups();
  }
  
  onHeaderVisibilityChange(isHidden: boolean) {
    this.headerHidden = isHidden;
  }
  
  getTotalCount(): number {
    return this.followups.length;
  }
  
  getPendingCount(): number {
    return this.followups.filter(f => f.status === 'pending').length;
  }
  
  getOverdueCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.followups.filter(f => {
      if (!f.dueDate || f.status === 'completed') return false;
      const due = new Date(f.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
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
    // Open edit modal when clicking on card
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
  
  toggleComplete(followup: FollowUpItem) {
    if (followup.status === 'completed') {
      followup.status = 'pending';
    } else {
      followup.status = 'completed';
    }
    this.filterFollowups();
    // TODO: Call service to update backend
  }
  
  openAssignModal(followup: FollowUpItem) {
    this.selectedFollowupForAssign = followup;
    this.showAssignModal = true;
  }
  
  openEditModal(followup: FollowUpItem) {
    this.editingFollowup = followup;
    this.followupForm = {
      personName: followup.personName,
      title: followup.title,
      description: followup.description || '',
      type: followup.type,
      priority: followup.priority,
      status: followup.status,
      assignedTo: followup.assignedTo || '',
      dueDate: followup.dueDate ? new Date(followup.dueDate).toISOString() : '',
      contactInfo: {
        phone: followup.contactInfo?.phone || '',
        email: followup.contactInfo?.email || ''
      }
    };
    this.showCreateModal = true;
  }
  
  createNewFollowup() {
    this.editingFollowup = null;
    this.followupForm = {
      personName: '',
      title: '',
      description: '',
      type: 'New Visitor Follow-up',
      priority: 'medium',
      status: 'pending',
      assignedTo: '',
      dueDate: '',
      contactInfo: {
        phone: '',
        email: ''
      }
    };
    this.showCreateModal = true;
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
    this.editingFollowup = null;
  }
  
  saveFollowup() {
    if (!this.isFormValid()) return;
    
    if (this.editingFollowup) {
      // Update existing followup
      const index = this.followups.findIndex(f => f.id === this.editingFollowup!.id);
      if (index > -1) {
        this.followups[index] = {
          ...this.followups[index],
          ...this.followupForm,
          dueDate: this.followupForm.dueDate ? new Date(this.followupForm.dueDate) : undefined
        };
      }
    } else {
      // Create new followup
      const newFollowup: FollowUpItem = {
        id: Date.now().toString(),
        ...this.followupForm,
        status: 'pending',
        createdDate: new Date(),
        dueDate: this.followupForm.dueDate ? new Date(this.followupForm.dueDate) : undefined
      };
      this.followups.unshift(newFollowup);
    }
    
    this.filterFollowups();
    this.closeCreateModal();
    // TODO: Call service to save to backend
  }
  
  isFormValid(): boolean {
    return !!(this.followupForm.personName && this.followupForm.title && this.followupForm.type);
  }
  
  getMinDate(): string {
    return new Date().toISOString();
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
  
  // Form field focus/blur handlers
  onFieldFocus(fieldName: string) {
    // Optional: Add focus handling logic
  }
  
  onFieldBlur(fieldName: string) {
    // Optional: Add blur handling logic
  }
}

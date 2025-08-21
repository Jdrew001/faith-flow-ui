import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { WorkflowTrigger } from '../../models';

@Component({
  selector: 'app-workflow-trigger-builder',
  templateUrl: './workflow-trigger-builder.component.html',
  styleUrls: ['./workflow-trigger-builder.component.scss'],
  standalone: false
})
export class WorkflowTriggerBuilderComponent implements OnInit {
  @Input() trigger?: WorkflowTrigger;
  @Output() triggerChange = new EventEmitter<WorkflowTrigger>();

  triggerForm!: FormGroup;
  
  conditionTypes = [
    { value: 'absences_in_period', label: 'Absences in Period', icon: 'close-circle-outline', color: 'danger' },
    { value: 'consecutive_absences', label: 'Consecutive Absences', icon: 'trending-down-outline', color: 'warning' },
    { value: 'no_attendance_days', label: 'No Attendance Days', icon: 'calendar-clear-outline', color: 'medium' },
    { value: 'attendance_percentage', label: 'Attendance Percentage', icon: 'stats-chart-outline', color: 'primary' }
  ];
  
  timeWindows = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 21, label: '21 days' },
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
    if (this.trigger) {
      this.loadTrigger();
    }
  }

  initializeForm() {
    this.triggerForm = this.fb.group({
      conditionType: ['absences_in_period'],
      count: [3],
      periodDays: [21],
      percentage: [50]
    });
    
    this.triggerForm.valueChanges.subscribe(values => {
      this.emitTrigger();
    });
  }

  loadTrigger() {
    if (!this.trigger || !this.trigger.conditions) return;
    
    const conditions = this.trigger.conditions;
    if (conditions.absences_in_period) {
      this.triggerForm.patchValue({
        conditionType: 'absences_in_period',
        count: conditions.absences_in_period.count,
        periodDays: conditions.absences_in_period.period_days
      }, { emitEvent: false });
    } else if (conditions.consecutive_absences) {
      this.triggerForm.patchValue({
        conditionType: 'consecutive_absences',
        count: conditions.consecutive_absences.count
      }, { emitEvent: false });
    } else if (conditions.no_attendance_days) {
      this.triggerForm.patchValue({
        conditionType: 'no_attendance_days',
        periodDays: conditions.no_attendance_days.days
      }, { emitEvent: false });
    } else if (conditions.attendance_percentage) {
      this.triggerForm.patchValue({
        conditionType: 'attendance_percentage',
        percentage: conditions.attendance_percentage.percentage,
        periodDays: conditions.attendance_percentage.period_days
      }, { emitEvent: false });
    }
  }

  incrementCount() {
    const current = this.triggerForm.get('count')?.value || 1;
    this.triggerForm.patchValue({ count: current + 1 });
  }

  decrementCount() {
    const current = this.triggerForm.get('count')?.value || 1;
    if (current > 1) {
      this.triggerForm.patchValue({ count: current - 1 });
    }
  }

  emitTrigger() {
    const formValue = this.triggerForm.value;
    const trigger: WorkflowTrigger = {
      type: 'attendance_rule',
      enabled: true,
      conditions: {}
    };
    
    switch (formValue.conditionType) {
      case 'absences_in_period':
        trigger.conditions!.absences_in_period = {
          count: formValue.count,
          period_days: formValue.periodDays
        };
        break;
      case 'consecutive_absences':
        trigger.conditions!.consecutive_absences = {
          count: formValue.count
        };
        break;
      case 'no_attendance_days':
        trigger.conditions!.no_attendance_days = {
          days: formValue.periodDays
        };
        break;
      case 'attendance_percentage':
        trigger.conditions!.attendance_percentage = {
          percentage: formValue.percentage,
          period_days: formValue.periodDays
        };
        break;
    }
    
    this.triggerChange.emit(trigger);
  }

}
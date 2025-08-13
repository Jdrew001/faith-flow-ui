import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { WorkflowTrigger, AttendanceType } from '../../models';

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
  
  attendanceTypes = [
    { value: 'missed' as AttendanceType, label: 'Missed', icon: 'close-circle-outline', color: 'danger' },
    { value: 'attended' as AttendanceType, label: 'Attended', icon: 'checkmark-circle-outline', color: 'success' },
    { value: 'first_time' as AttendanceType, label: 'First Time', icon: 'person-add-outline', color: 'primary' }
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
      attendanceType: ['missed'],
      frequency: [3],
      timeWindowDays: [21]
    });
    
    this.triggerForm.valueChanges.subscribe(values => {
      this.emitTrigger();
    });
  }

  loadTrigger() {
    if (!this.trigger) return;
    
    this.triggerForm.patchValue({
      attendanceType: this.trigger.attendanceType || 'missed',
      frequency: this.trigger.frequency || 3,
      timeWindowDays: this.trigger.timeWindowDays || 21
    }, { emitEvent: false });
  }

  incrementFrequency() {
    const current = this.triggerForm.get('frequency')?.value || 1;
    this.triggerForm.patchValue({ frequency: current + 1 });
  }

  decrementFrequency() {
    const current = this.triggerForm.get('frequency')?.value || 1;
    if (current > 1) {
      this.triggerForm.patchValue({ frequency: current - 1 });
    }
  }

  emitTrigger() {
    const formValue = this.triggerForm.value;
    const trigger: WorkflowTrigger = {
      type: 'attendance',
      attendanceType: formValue.attendanceType,
      frequency: formValue.frequency,
      timeWindowDays: formValue.timeWindowDays
    };
    
    this.triggerChange.emit(trigger);
  }

  getTriggerDescription(): string {
    const values = this.triggerForm.value;
    
    let typeText = '';
    switch (values.attendanceType) {
      case 'missed':
        typeText = 'has missed';
        break;
      case 'attended':
        typeText = 'has attended';
        break;
      case 'first_time':
        typeText = 'is a first-time visitor';
        break;
    }
    
    const frequencyText = values.frequency === 1 ? 'once' : `${values.frequency} times`;
    const windowText = `in the past ${values.timeWindowDays} days`;
    
    return `Trigger when someone ${typeText} ${frequencyText} ${windowText}`;
  }
}
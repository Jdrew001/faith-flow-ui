import { Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MemberService } from '../../../services/member.service';

export interface SelectedMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

@Component({
  selector: 'app-member-search',
  templateUrl: './member-search.component.html',
  styleUrls: ['./member-search.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberSearchComponent),
      multi: true
    }
  ],
  standalone: false
})
export class MemberSearchComponent implements OnInit, ControlValueAccessor {
  @Input() placeholder = 'Search for a member...';
  @Input() disabled = false;
  @Input() required = false;
  @Output() memberSelected = new EventEmitter<SelectedMember | null>();

  searchQuery = '';
  searchResults: SelectedMember[] = [];
  isSearching = false;
  showResults = false;
  selectedMember: SelectedMember | null = null;
  
  private searchSubject = new Subject<string>();
  private onChange: (value: SelectedMember | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private memberService: MemberService) {}

  ngOnInit() {
    // Set up debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(async (query) => {
        await this.performSearch(query);
      });
  }

  // ControlValueAccessor implementation
  writeValue(value: SelectedMember | null): void {
    this.selectedMember = value;
    if (value) {
      this.searchQuery = value.name;
    } else {
      this.searchQuery = '';
    }
  }

  registerOnChange(fn: (value: SelectedMember | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Search functionality
  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const query = target.value;
    this.searchQuery = query;
    
    if (!query || query.length < 2) {
      this.searchResults = [];
      this.showResults = false;
      
      // If user cleared the input, clear the selection
      if (!query && this.selectedMember) {
        this.clearSelection();
      }
      return;
    }

    this.searchSubject.next(query);
  }

  private async performSearch(query: string) {
    this.isSearching = true;
    this.showResults = true;

    try {
      const response = await this.memberService.searchMembersTypeahead(query);
      this.searchResults = response.results;
    } catch (error) {
      console.error('Error searching members:', error);
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectMember(member: SelectedMember) {
    this.selectedMember = member;
    this.searchQuery = member.name;
    this.showResults = false;
    this.searchResults = [];
    
    // Emit the selection
    this.onChange(member);
    this.memberSelected.emit(member);
  }

  clearSelection() {
    this.selectedMember = null;
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
    
    this.onChange(null);
    this.memberSelected.emit(null);
  }

  onFocus() {
    this.onTouched();
    
    // Show results if we have any and user focuses back
    if (this.searchResults.length > 0 && !this.selectedMember) {
      this.showResults = true;
    }
  }

  onBlur() {
    // Delay hiding results to allow click on result
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  getDisplayValue(): string {
    return this.selectedMember ? this.selectedMember.name : this.searchQuery;
  }
}
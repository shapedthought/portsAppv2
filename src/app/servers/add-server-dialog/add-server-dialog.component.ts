import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Server } from '../../models/server';

@Component({
  selector: 'app-add-server-dialog',
  imports: [
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    CommonModule,
  ],
  templateUrl: './add-server-dialog.component.html',
  styleUrl: './add-server-dialog.component.css',
})
export class AddServerDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() serverToEdit: Server | null = null;
  @Output() saveServer = new EventEmitter<{
    id?: number;
    name: string;
    location: string;
  }>();
  @Output() hideDialog = new EventEmitter<void>();

  serverForm!: FormGroup;
  dialogMode: 'add' | 'edit' = 'add';

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reset form when dialog becomes visible
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.initForm();
    }

    // If a server is passed for editing, update the form
    if (changes['serverToEdit'] && changes['serverToEdit'].currentValue) {
      this.dialogMode = 'edit';
      this.updateFormWithServerData();
    } else if (
      changes['serverToEdit'] &&
      !changes['serverToEdit'].currentValue
    ) {
      this.dialogMode = 'add';
    }
  }

  private initForm() {
    this.serverForm = this.fb.group({
      serverName: ['', [Validators.required, Validators.minLength(3)]],
      serverLocation: ['', Validators.required],
    });

    // If editing, populate the form
    if (this.serverToEdit) {
      this.updateFormWithServerData();
    }
  }

  private updateFormWithServerData() {
    if (this.serverToEdit) {
      this.serverForm.patchValue({
        serverName: this.serverToEdit.name,
        serverLocation: this.serverToEdit.location,
      });
    }
  }

  onSaveServer() {
    if (this.serverForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.serverForm.controls).forEach((key) => {
        const control = this.serverForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.saveServer.emit({
      id: this.serverToEdit?.id,
      name: this.serverForm.value.serverName,
      location: this.serverForm.value.serverLocation,
    });
    this.resetAndHide();
  }

  onToggleDialog() {
    this.resetAndHide();
  }

  private resetAndHide() {
    this.serverForm.reset();
    this.hideDialog.emit();
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const control = this.serverForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.serverForm.get(fieldName);

    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }

    if (control.hasError('minlength')) {
      return `Must be at least ${
        control.getError('minlength').requiredLength
      } characters`;
    }

    return '';
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Server' : 'Edit Server';
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-field">
      <label *ngIf="label" [for]="id">{{ label }}</label>

      <div class="input-with-icon">
        <input
          [id]="id"
          [name]="name || id"
          [(ngModel)]="internalValue"
          [type]="type"
          [placeholder]="placeholder"
          [attr.aria-label]="ariaLabel || label || id"
          [required]="required"
        />

        <!-- slot for right-side icon/button -->
        <ng-content select=".right-slot"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      label { display:block; margin-bottom:8px; font-size:13px; color:#505050; font-weight:600; }
      .input-with-icon { position:relative; display:flex; align-items:center; }
      input { flex:1; width:100%; height:54px; border-radius:14px; padding:0 18px; padding-right:56px; border:none; outline:none; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-size:14px; background:white; }
      input::placeholder { color: #a7a7a7; }
      input:focus { box-shadow: 0 8px 24px rgba(47,21,176,0.08); border:1px solid rgba(47,21,176,0.15); }

      /* Right-side slot (icon/button) positioned over the input */
      ::ng-deep .right-slot,
      .right-slot,
      ::ng-deep .input-icon-button,
      .input-icon-button {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 36px;
        border-radius: 10px;
        border: none;
        background: rgba(0,0,0,0.02);
        cursor: pointer;
        transition: background 120ms ease, transform 120ms ease;
      }

      ::ng-deep .input-icon-button:hover,
      .input-icon-button:hover {
        background: rgba(47,21,176,0.06);
        transform: translateY(-50%) scale(1.03);
      }

      .eye {
        font-size: 16px;
        color: #535353;
        line-height: 1;
      }
    `
  ]
})
export class InputFieldComponent {
  @Input() id = '';
  @Input() name?: string;
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() ariaLabel?: string;
  @Input() required = false;

  internalValue = '';

  get value(): string {
    return this.internalValue;
  }

  set value(v: string) {
    this.internalValue = v;
  }
}

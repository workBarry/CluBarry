import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="backdrop" *ngIf="open">
      <div class="modal confirm">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="actions">
          <button class="btn ghost" type="button" (click)="cancel.emit()">取消</button>
          <button class="btn primary" type="button" [class.danger]="danger" (click)="confirmed.emit()">{{ confirmText }}</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 1rem; background: rgba(15,23,42,0.36); }
      .modal { width: min(440px,100%); border: 1px solid #dbe3ef; border-radius: 0.9rem; padding: 1.25rem; background: #fff; box-shadow: 0 18px 50px rgba(15,23,42,0.1); }
      .confirm { display: grid; gap: 0.75rem; }
      h2 { margin: 0; } p { margin: 0; color: #65758b; }
      .actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
      .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 2.35rem; border: 1px solid #dbe3ef; border-radius: 0.65rem; padding: 0 0.85rem; cursor: pointer; font-weight: 800; }
      .btn.primary { color: #fff; background: #166534; border-color: #166534; }
      .btn.primary.danger { background: #b91c1c; border-color: #b91c1c; }
      .btn.ghost { color: #14532d; background: #eef5f2; }
    `,
  ],
})
export class ConfirmDialog {
  @Input() open = false;
  @Input() title = '確認';
  @Input() message = '';
  @Input() confirmText = '確認';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

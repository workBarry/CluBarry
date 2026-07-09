import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="toolbar">
      <input type="search" [ngModel]="keyword" (ngModelChange)="keywordChange.emit($event)" [placeholder]="placeholder" />
      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      .toolbar { display: grid; grid-template-columns: 1fr 14rem 13rem; gap: 0.75rem; margin-top: 1.5rem; }
      input, select { width: 100%; min-height: 2.75rem; border: 1px solid #dbe3ef; border-radius: 0.65rem; padding: 0 0.85rem; color: #18212f; background: #fff; font: inherit; }
    `,
  ],
})
export class SearchToolbar {
  @Input() keyword = '';
  @Input() placeholder = '搜尋...';
  @Output() keywordChange = new EventEmitter<string>();
}

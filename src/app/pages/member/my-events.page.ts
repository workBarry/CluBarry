import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';

@Component({
  selector: 'app-my-events-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-heading">
      <span class="eyebrow">My Events</span>
      <h1>我的活動</h1>
      <p>已報名、已取消與已完成活動會集中顯示在這裡。</p>
    </section>

    <section class="tabs">
      <button *ngFor="let item of tabs" type="button" [class.active]="status === item.value" (click)="status = item.value">
        {{ item.label }}
      </button>
    </section>

    <section class="list-panel">
      <article class="activity-row" *ngFor="let row of filteredRows">
        <span class="avatar-box" [style.background]="row.event?.cover">{{ row.event?.title?.slice(0, 1) }}</span>
        <div>
          <strong>{{ row.event?.title }}</strong>
          <p>{{ row.event?.startTime | date:'yyyy/MM/dd HH:mm' }} / {{ row.event?.location }}</p>
        </div>
        <span class="status-pill">{{ statusLabel(row.registration.status) }}</span>
        <button class="btn danger small" type="button" *ngIf="row.registration.status === 'registered'" (click)="cancel(row.registration.id)">取消</button>
      </article>
    </section>
  `,
})
export class MyEventsPage {
  private readonly data = inject(ClubDataService);

  status = 'registered';
  readonly tabs = [
    { label: '已報名', value: 'registered' },
    { label: '已取消', value: 'cancelled' },
    { label: '已完成', value: 'completed' },
  ];

  get filteredRows() {
    return this.data
      .registrationsForCurrentUser()
      .filter((registration) => registration.status === this.status)
      .map((registration) => ({ registration, event: this.data.eventById(registration.eventId) }));
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      registered: '已報名',
      cancelled: '已取消',
      completed: '已完成',
      waitlisted: '候補',
    };
    return labels[status] ?? status;
  }

  cancel(id: number): void {
    this.data.cancelRegistration(id);
  }
}

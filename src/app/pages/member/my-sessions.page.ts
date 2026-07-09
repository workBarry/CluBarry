import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClubDataService } from '../../services/club-data.service';
import { Registration } from '../../types/club.models';

@Component({
  selector: 'app-my-sessions-page',
  imports: [CommonModule],
  template: `
    <section class="page-heading">
      <span class="eyebrow">My Sessions</span>
      <h1>我的場次</h1>
      <p>你報名過的活動場次會集中顯示在這裡。</p>
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
          <strong>{{ row.session?.title }}</strong>
          <p>{{ row.club?.name }} / {{ row.event?.title }}</p>
          <small>{{ row.session?.startTime | date:'yyyy/MM/dd HH:mm' }} / {{ row.session?.location }}</small>
        </div>
        <span class="status-pill">{{ statusLabel(row.registration.status) }}</span>
        <button class="btn danger small" type="button" *ngIf="row.registration.status === 'registered'" (click)="cancel(row.registration.id)">取消</button>
      </article>
      <p class="empty" *ngIf="filteredRows.length === 0">此分頁沒有場次紀錄。</p>
    </section>
  `,
})
export class MySessionsPage {
  readonly data = inject(ClubDataService);

  status = 'registered';
  readonly tabs = [
    { label: '已報名', value: 'registered' },
    { label: '已取消', value: 'cancelled' },
    { label: '已完成', value: 'completed' },
  ];

  get filteredRows() {
    return this.data
      .registrationsForCurrentUser()
      .filter((r) => r.status === this.status)
      .map((registration) => ({
        registration,
        session: this.data.sessionById(registration.sessionId),
        event: this.data.eventById(registration.eventId),
        club: this.data.clubById(registration.clubId),
      }));
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

  cancel(id: string): void {
    this.data.cancelRegistration(id);
  }
}

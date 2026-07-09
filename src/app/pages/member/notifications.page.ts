import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClubDataService } from '../../services/club-data.service';

@Component({
  selector: 'app-notifications-page',
  imports: [CommonModule],
  template: `
    <section class="page-heading">
      <span class="eyebrow">Notifications</span>
      <h1>我的通知</h1>
      <p>活動提醒、公告通知與審核通知會依時間排序。</p>
    </section>

    <section class="list-panel">
      <article class="notification-row" *ngFor="let item of data.notificationsForCurrentUser()" [class.unread]="!item.isRead">
        <span class="type-dot">{{ label(item.type) }}</span>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.content }}</p>
        </div>
        <small>{{ item.createdAt | date:'yyyy/MM/dd HH:mm' }}</small>
      </article>
    </section>
  `,
})
export class NotificationsPage {
  readonly data = inject(ClubDataService);

  label(type: string): string {
    const labels: Record<string, string> = {
      event: '活動',
      announcement: '公告',
      review: '審核',
    };
    return labels[type] ?? type;
  }
}

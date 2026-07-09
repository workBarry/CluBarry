import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';

@Component({
  selector: 'app-announcement-detail-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-layout" *ngIf="announcement as item; else missing">
      <div class="detail-banner" [style.background]="item.cover">
        <span>{{ item.category }}</span>
        <h1>{{ item.title }}</h1>
      </div>
      <article class="panel readable">
        <div class="meta-row">
          <span *ngIf="item.isPinned">置頂公告</span>
          <span>{{ item.createdAt | date:'yyyy/MM/dd HH:mm' }}</span>
        </div>
        <p>{{ item.content }}</p>
        <a class="btn secondary" routerLink="/announcements">返回公告列表</a>
      </article>
    </section>

    <ng-template #missing>
      <section class="empty-state">
        <h1>找不到公告</h1>
        <a class="btn secondary" routerLink="/announcements">返回公告列表</a>
      </section>
    </ng-template>
  `,
})
export class AnnouncementDetailPage {
  private readonly data = inject(ClubDataService);
  private readonly route = inject(ActivatedRoute);

  readonly announcement = this.data.announcementById(Number(this.route.snapshot.paramMap.get('id')));
}

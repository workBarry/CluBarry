import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { Session } from '../../types/club.models';

@Component({
  selector: 'app-session-detail-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-layout" *ngIf="session as s; else missing">
      <div class="detail-banner" [style.background]="event?.cover">
        <span>{{ event?.category }}</span>
        <h1>{{ s.title }}</h1>
      </div>

      <div class="content-grid">
        <article class="panel span-7 readable">
          <h2>場次資訊</h2>
          <p>所屬活動：<a [routerLink]="['/clubs', s.clubId, 'events', s.eventId]">{{ event?.title }}</a></p>
          <p>本場次由社長設定是否開放非社員參加。</p>
        </article>

        <aside class="panel span-5">
          <h2>報名</h2>
          <div class="info-list">
            <span>時間</span><strong>{{ s.startTime | date:'yyyy/MM/dd HH:mm' }} - {{ s.endTime | date:'HH:mm' }}</strong>
            <span>地點</span><strong>{{ s.location }}</strong>
            <span>名額</span><strong>{{ s.currentCount }} / {{ s.capacity }}</strong>
            <span>對象</span><strong>{{ s.openToNonMember ? '開放所有人' : '僅限社員' }}</strong>
          </div>
          <p class="notice" *ngIf="data.message">{{ data.message }}</p>
          <button class="btn primary full" type="button" (click)="register(s)"
            [disabled]="data.isRegistered(s.id) || s.status !== 'open' || s.currentCount >= s.capacity">
            {{ data.isRegistered(s.id) ? '已報名' : s.status !== 'open' ? '已截止' : '我要報名' }}
          </button>
          <a class="btn secondary full" [routerLink]="['/clubs', s.clubId, 'events', s.eventId]">返回活動</a>
        </aside>
      </div>
    </section>

    <ng-template #missing>
      <section class="empty-state">
        <h1>找不到場次</h1>
        <a class="btn secondary" routerLink="/events">返回活動列表</a>
      </section>
    </ng-template>
  `,
})
export class SessionDetailPage {
  readonly data = inject(ClubDataService);
  private readonly route = inject(ActivatedRoute);

  readonly session = this.data.sessionById(this.route.snapshot.paramMap.get('sid'));
  get event() {
    return this.session ? this.data.eventById(this.session.eventId) : undefined;
  }

  register(session: Session): void {
    this.data.register(session);
  }
}

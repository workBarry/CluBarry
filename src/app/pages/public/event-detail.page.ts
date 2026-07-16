import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { Session } from '../../types/club.models';

@Component({
  selector: 'app-event-detail-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-layout" *ngIf="event() as item; else missing">
      <div class="detail-banner" [style.background]="item.cover">
        <span>{{ item.category }}</span>
        <h1>{{ item.title }}</h1>
      </div>

      <div class="content-grid">
        <article class="panel span-7 readable">
          <h2>活動介紹</h2>
          <p>{{ item.description }}</p>
          <div class="event-meta">
            <span>開始時間：{{ item.startTime | date:'yyyy/MM/dd HH:mm' }}</span>
            <span>結束時間：{{ item.endTime | date:'yyyy/MM/dd HH:mm' }}</span>
            <span>報名截止：{{ item.deadline | date:'yyyy/MM/dd HH:mm' }}</span>
          </div>
          <h3>流程</h3>
          <ol class="agenda">
            <li *ngFor="let agenda of item.agenda">{{ agenda }}</li>
          </ol>
        </article>

        <aside class="panel span-5">
          <h2>場次報名</h2>
          <p class="muted">選擇場次完成報名；未開放非社員的場次僅限該社團社員參加。</p>
          <div class="session-list">
            <a class="session-row" *ngFor="let s of sessions()" [routerLink]="['/clubs', item.clubId, 'events', item.id, 'sessions', s.id]">
              <div>
                <strong>{{ s.title }}</strong>
                <small>{{ s.startTime | date:'yyyy/MM/dd HH:mm' }} - {{ s.endTime | date:'HH:mm' }}</small>
                <small>{{ s.location }}</small>
              </div>
              <span class="session-meta">
                <span class="pill" [class.open]="s.status === 'open'">{{ statusLabel(s) }}</span>
                <span *ngIf="!s.openToNonMember" class="member-only">社員限定</span>
                <span>{{ s.currentCount }} / {{ s.capacity }}</span>
              </span>
            </a>
          </div>
          <a class="btn secondary full" [routerLink]="['/clubs', item.clubId]">返回社團</a>
        </aside>
      </div>
    </section>

    <ng-template #missing>
      <section class="empty-state">
        <h1>找不到活動</h1>
        <a class="btn secondary" routerLink="/events">返回活動列表</a>
      </section>
    </ng-template>
  `,
  styles: [`
    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin: 0.5rem 0 1rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
  `],
})
export class EventDetailPage {
  readonly data = inject(ClubDataService);
  private readonly route = inject(ActivatedRoute);

  readonly event = computed(() => this.data.eventById(this.route.snapshot.paramMap.get('eid')));
  readonly sessions = computed(() => {
    const e = this.event();
    return e ? this.data.sessionsByEvent(e.id) : [];
  });

  statusLabel(session: Session): string {
    return session.status === 'open' ? '報名中' : session.status === 'closed' ? '已截止' : '已結束';
  }
}

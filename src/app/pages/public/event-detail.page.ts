import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { ClubEvent } from '../../types/club.models';

@Component({
  selector: 'app-event-detail-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-layout" *ngIf="event as item; else missing">
      <div class="detail-banner" [style.background]="item.cover">
        <span>{{ item.category }}</span>
        <h1>{{ item.title }}</h1>
      </div>

      <div class="content-grid">
        <article class="panel span-7 readable">
          <h2>活動介紹</h2>
          <p>{{ item.description }}</p>
          <h3>流程</h3>
          <ol class="agenda">
            <li *ngFor="let agenda of item.agenda">{{ agenda }}</li>
          </ol>
        </article>

        <aside class="panel span-5">
          <h2>活動資訊</h2>
          <div class="info-list">
            <span>日期</span><strong>{{ item.startTime | date:'yyyy/MM/dd HH:mm' }} - {{ item.endTime | date:'HH:mm' }}</strong>
            <span>地點</span><strong>{{ item.location }}</strong>
            <span>名額</span><strong>{{ item.currentCount }} / {{ item.capacity }}</strong>
            <span>報名截止</span><strong>{{ item.deadline | date:'yyyy/MM/dd HH:mm' }}</strong>
          </div>
          <button class="btn primary full" type="button" (click)="register(item)" [disabled]="data.isRegistered(item.id)">
            {{ data.isRegistered(item.id) ? '已報名' : '我要報名' }}
          </button>
          <a class="btn secondary full" routerLink="/events">返回活動列表</a>
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
})
export class EventDetailPage {
  readonly data = inject(ClubDataService);
  private readonly route = inject(ActivatedRoute);

  readonly event = this.data.eventById(Number(this.route.snapshot.paramMap.get('id')));

  register(event: ClubEvent): void {
    this.data.register(event.id);
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { Club, ClubEvent } from '../../types/club.models';

@Component({
  selector: 'app-club-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-banner tall" *ngIf="club as c; else missing" [style.background]="c.cover">
      <span>{{ c.category }}</span>
      <h1>{{ c.name }}</h1>
      <p>{{ c.description }}</p>
    </section>

    <ng-template #missing>
      <section class="empty-state"><h1>找不到社團</h1><a class="btn secondary" routerLink="/">回首頁</a></section>
    </ng-template>

    <section class="section" *ngIf="club as c">
      <div class="section-heading">
        <div><span class="eyebrow">Events</span><h2>{{ c.name }} 的活動</h2></div>
      </div>
      <div class="card-grid">
        <article class="event-card" *ngFor="let event of events">
          <div class="event-cover" [style.background]="event.cover"></div>
          <div class="event-body">
            <span class="tag">{{ event.category }}</span>
            <h3>{{ event.title }}</h3>
            <p>{{ event.description }}</p>
            <a class="btn small" [routerLink]="['/clubs', c.id, 'events', event.id]">場次與報名</a>
          </div>
        </article>
        <p class="empty" *ngIf="events.length === 0">此社團尚無已開放的活動。</p>
      </div>
    </section>

    <section class="section" *ngIf="club as c">
      <div class="section-heading">
        <div><span class="eyebrow">Announcements</span><h2>社團公告</h2></div>
      </div>
      <div class="announcement-list">
        <article class="announcement-item" *ngFor="let a of announcements">
          <span class="pin" *ngIf="a.isPinned">置頂</span>
          <strong>{{ a.title }}</strong>
          <small>{{ a.category }} / {{ a.createdAt | date:'yyyy/MM/dd' }}</small>
          <p>{{ a.content }}</p>
        </article>
        <p class="empty" *ngIf="announcements.length === 0">尚無公告。</p>
      </div>
    </section>
  `,
})
export class ClubPage {
  readonly data = inject(ClubDataService);
  private readonly route = inject(ActivatedRoute);

  readonly club = this.data.clubById(this.route.snapshot.paramMap.get('cid'));

  get events(): ClubEvent[] {
    return this.club ? this.data.eventsByClub(this.club.id) : [];
  }

  get announcements() {
    return this.club ? this.data.announcementsByClub(this.club.id) : [];
  }
}

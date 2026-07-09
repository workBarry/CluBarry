import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { ClubEvent } from '../../types/club.models';

@Component({
  selector: 'app-events-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-heading">
      <span class="eyebrow">Events</span>
      <h1>活動</h1>
      <p>支援活動分類、搜尋、日期篩選與線上報名。</p>
    </section>

    <section class="toolbar">
      <input type="search" [(ngModel)]="keyword" placeholder="搜尋活動名稱、地點或標籤" />
      <select [(ngModel)]="category">
        <option>全部</option>
        <option *ngFor="let item of categories">{{ item }}</option>
      </select>
      <input type="date" [(ngModel)]="date" />
    </section>

    <section class="card-grid">
        <article class="event-card" *ngFor="let event of filteredEvents">
          <div class="event-cover" [style.background]="event.cover"></div>
          <div class="event-body">
            <span class="tag">{{ event.category }}</span>
            <h2>{{ event.title }}</h2>
            <p>{{ event.description }}</p>
            <div class="meta-row">
              <span>{{ clubName(event) }}</span>
              <span>{{ event.startTime | date:'yyyy/MM/dd HH:mm' }}</span>
              <span>{{ event.location }}</span>
            </div>
            <a class="btn secondary small" [routerLink]="['/clubs', event.clubId, 'events', event.id]">場次與報名</a>
          </div>
        </article>
    </section>
  `,
})
export class EventsPage {
  readonly data = inject(ClubDataService);

  keyword = '';
  category = '全部';
  date = '';

  get categories(): string[] {
    return [...new Set(this.data.events().map((event) => event.category))];
  }

  get filteredEvents(): ClubEvent[] {
    const keyword = this.keyword.trim().toLowerCase();
    return this.data.events().filter((event) => {
      const matchKeyword =
        !keyword || `${event.title} ${event.location} ${event.tags.join(' ')}`.toLowerCase().includes(keyword);
      const matchCategory = this.category === '全部' || event.category === this.category;
      const matchDate = !this.date || event.startTime.startsWith(this.date);
      return matchKeyword && matchCategory && matchDate;
    });
  }

  remaining(event: ClubEvent): number {
    return event.capacity - event.currentCount;
  }

  clubName(event: ClubEvent): string {
    return this.data.clubById(event.clubId)?.name ?? '';
  }
}

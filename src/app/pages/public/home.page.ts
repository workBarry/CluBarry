import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { Club, ClubEvent } from '../../types/club.models';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero-section">
      <div class="hero-copy">
        <span class="eyebrow">ClubWeb</span>
        <h1>探索社團、報名場次、掌握最新公告</h1>
        <p>前台以「社團」為核心，每個社團可以開設活動與多個場次，社長可設定每個場次是否開放非社員參加。</p>
        <div class="hero-actions">
          <a class="btn primary" routerLink="/events">查看活動</a>
          <a class="btn secondary" routerLink="/create-club">開立社團</a>
        </div>
      </div>
      <div class="hero-visual" aria-label="社團概況">
        <div class="visual-stat">
          <strong>{{ data.clubs().length }}</strong>
          <span>活躍社團</span>
        </div>
        <div class="visual-card" *ngFor="let club of featuredClubs">
          <span [style.background]="club.cover"></span>
          <div>
            <strong>{{ club.name }}</strong>
            <small>{{ club.category }}</small>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Clubs</span>
          <h2>社團目錄</h2>
        </div>
        <a routerLink="/events">所有活動</a>
      </div>
      <div class="card-grid">
        <article class="club-card" *ngFor="let club of data.clubs()">
          <div class="club-cover" [style.background]="club.cover">
            <span class="club-logo">{{ club.logo }}</span>
          </div>
          <div class="club-body">
            <h3>{{ club.name }}</h3>
            <span class="tag">{{ club.category }}</span>
            <p>{{ club.description }}</p>
            <a class="btn small" [routerLink]="['/clubs', club.id]">進入社團</a>
          </div>
        </article>
        <p class="empty" *ngIf="data.clubs().length === 0">目前尚無已開放的社團。</p>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Events</span>
          <h2>本月活動</h2>
        </div>
        <a routerLink="/events">探索活動</a>
      </div>
      <div class="event-list">
        <article class="event-row" *ngFor="let event of currentMonthEvents()">
          <span class="event-accent" [style.background]="event.cover"></span>
          <div class="event-info">
            <div class="event-meta-top">
              <span class="club-badge">{{ getClubName(event.clubId) }}</span>
              <span class="small-tag">{{ event.category }}</span>
            </div>
            <h3>{{ event.title }}</h3>
            <div class="event-details">
              <span>{{ event.startTime | date:'MM/dd EEEE' }}</span>
              <span>{{ event.location }}</span>
              <span>剩餘 {{ remaining(event) }}</span>
            </div>
          </div>
          <a class="btn small discord-btn" [routerLink]="['/clubs', event.clubId, 'events', event.id]">查看</a>
        </article>
        <p class="empty" *ngIf="currentMonthEvents().length === 0">本月暫無活動。</p>
      </div>
    </section>

    <footer class="footer">
      <div>
        <strong>ClubWeb</strong>
        <span>club&#64;example.edu.tw / FB / IG / Discord</span>
      </div>
    </footer>
  `,
  styles: [`
    .event-list {
      display: grid;
      gap: 0.5rem;
    }
    .event-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.7rem 1rem;
      border-radius: 0.5rem;
      background: #2b2d31;
      transition: background 0.15s;
    }
    .event-row:hover {
      background: #35373c;
    }
    .event-accent {
      flex: 0 0 3px;
      align-self: stretch;
      border-radius: 999px;
    }
    .event-info {
      flex: 1;
      min-width: 0;
    }
    .event-meta-top {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.2rem;
    }
    .club-badge {
      color: #b5bac1;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .small-tag {
      padding: 0.1rem 0.4rem;
      font-size: 0.65rem;
      color: #dbdee1;
      background: #4e5058;
      border-radius: 999px;
    }
    .event-info h3 {
      margin-bottom: 0.2rem;
      color: #f2f3f5;
      font-size: 0.92rem;
      line-height: 1.3;
    }
    .event-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      color: #b5bac1;
      font-size: 0.78rem;
    }
    .discord-btn {
      flex: 0 0 auto;
      color: #fff;
      background: #5865f2;
      border-color: transparent;
    }
    .discord-btn:hover {
      background: #4752c4;
    }
  `],
})
export class HomePage {
  readonly data = inject(ClubDataService);

  readonly currentMonthEvents = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.data.events().filter(e => {
      const d = new Date(e.startTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  });

  get featuredClubs(): Club[] {
    return this.data.clubs().slice(0, 3);
  }

  getClubName(clubId: string): string {
    return this.data.clubById(clubId)?.name ?? '';
  }

  remaining(event: ClubEvent): number {
    return event.capacity - event.currentCount;
  }
}

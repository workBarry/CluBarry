import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
          <h2>近期活動</h2>
        </div>
        <a routerLink="/events">探索活動</a>
      </div>
      <div class="card-grid">
        <article class="event-card" *ngFor="let event of latestEvents">
          <div class="event-cover" [style.background]="event.cover"></div>
          <div class="event-body">
            <span class="tag">{{ event.category }}</span>
            <h3>{{ event.title }}</h3>
            <p>{{ event.description }}</p>
            <div class="meta-row">
              <span>{{ event.startTime | date:'yyyy/MM/dd' }}</span>
              <span>{{ event.location }}</span>
              <span>剩餘 {{ remaining(event) }}</span>
            </div>
            <a class="btn small" [routerLink]="['/clubs', event.clubId, 'events', event.id]">查看詳情</a>
          </div>
        </article>
      </div>
    </section>

    <footer class="footer">
      <div>
        <strong>ClubWeb</strong>
        <span>club&#64;example.edu.tw / FB / IG / Discord</span>
      </div>
    </footer>
  `,
})
export class HomePage {
  readonly data = inject(ClubDataService);

  get featuredClubs(): Club[] {
    return this.data.clubs().slice(0, 3);
  }

  get latestEvents(): ClubEvent[] {
    return this.data.events().slice(0, 3);
  }

  remaining(event: ClubEvent): number {
    return event.capacity - event.currentCount;
  }
}

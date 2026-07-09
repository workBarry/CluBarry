import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { ClubEvent } from '../../types/club.models';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero-section">
      <div class="hero-copy">
        <span class="eyebrow">Club Management System</span>
        <h1>社團活動、公告與社員服務集中管理</h1>
        <p>前台提供公告瀏覽、活動報名、個人活動紀錄與通知中心，讓社員可以快速完成日常操作。</p>
        <div class="hero-actions">
          <a class="btn primary" routerLink="/events">查看活動</a>
          <a class="btn secondary" routerLink="/register">加入社團</a>
        </div>
      </div>
      <div class="hero-visual" aria-label="社團活動概況">
        <div class="visual-stat">
          <strong>{{ data.events().length }}</strong>
          <span>近期活動</span>
        </div>
        <div class="visual-card" *ngFor="let event of latestEvents">
          <span [style.background]="event.cover"></span>
          <div>
            <strong>{{ event.title }}</strong>
            <small>{{ event.startTime | date:'MM/dd HH:mm' }} / {{ event.location }}</small>
          </div>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel span-7">
        <div class="section-heading">
          <div>
            <span class="eyebrow">News</span>
            <h2>最新公告</h2>
          </div>
          <a routerLink="/announcements">全部公告</a>
        </div>
        <div class="announcement-list">
          <a class="announcement-item" *ngFor="let item of latestAnnouncements" [routerLink]="['/announcements', item.id]">
            <span class="pin" *ngIf="item.isPinned">置頂</span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.category }} / {{ item.createdAt | date:'yyyy/MM/dd' }}</small>
            <p>{{ item.content }}</p>
          </a>
        </div>
      </article>

      <aside class="panel span-5">
        <div class="section-heading">
          <div>
            <span class="eyebrow">About</span>
            <h2>社團介紹</h2>
          </div>
        </div>
        <p class="muted">本系統支援 Visitor、Member、Officer、Admin 四種角色，依權限開放瀏覽、報名、管理與審核功能。</p>
        <div class="role-stack">
          <span>Visitor</span>
          <span>Member</span>
          <span>Officer</span>
          <span>Admin</span>
        </div>
      </aside>
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
            <a class="btn small" [routerLink]="['/events', event.id]">查看詳情</a>
          </div>
        </article>
      </div>
    </section>

    <footer class="footer">
      <div>
        <strong>ClubWeb</strong>
        <span>club&#64;example.edu.tw / FB / IG / Discord</span>
      </div>
      <a routerLink="/login">社員登入</a>
    </footer>
  `,
})
export class HomePage {
  readonly data = inject(ClubDataService);

  get latestEvents(): ClubEvent[] {
    return this.data.events().slice(0, 3);
  }

  get latestAnnouncements() {
    return this.data.announcements().slice(0, 3);
  }

  remaining(event: ClubEvent): number {
    return event.capacity - event.currentCount;
  }
}

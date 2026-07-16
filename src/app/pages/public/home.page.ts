import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { Club, ClubEvent } from '../../types/club.models';

type PublishStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'archived';

type HomePlacement =
  | 'home_marquee'
  | 'home_event_list'
  | 'home_recommended_club';

/**
 * 預留給後台上稿使用的欄位。
 *
 * 現階段 Club、ClubEvent 即使還沒有這些欄位，
 * 頁面仍然可以正常顯示。
 */
interface CmsContent {
  publishStatus?: PublishStatus;
  placements?: HomePlacement[];
  sortOrder?: number;
  publishAt?: string | null;
  unpublishAt?: string | null;
}

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-page">
      <!-- 最上方推薦活動跑馬燈 -->
      <section
        class="announcement-strip"
        *ngIf="featuredEvents().length > 0"
        aria-label="推薦活動"
      >
        <div class="ticker-window">
          <div class="ticker-track">
            <div class="ticker-group">
              <a
                class="ticker-item"
                *ngFor="let event of featuredEvents(); trackBy: trackById"
                [routerLink]="[
                  '/clubs',
                  event.clubId,
                  'events',
                  event.id
                ]"
              >
                <span
                  class="ticker-accent"
                  [style.background]="event.cover"
                ></span>

                <strong>{{ event.title }}</strong>

                <span class="ticker-meta">
                  {{ event.startTime | date: 'MM/dd HH:mm' }}
                </span>

                <span class="ticker-club">
                  {{ getClubName(event.clubId) }}
                </span>
              </a>
            </div>

            <!-- 複製一組，讓跑馬燈能夠無縫循環 -->
            <div class="ticker-group" aria-hidden="true">
              <a
                class="ticker-item"
                *ngFor="let event of featuredEvents(); trackBy: trackById"
                [routerLink]="[
                  '/clubs',
                  event.clubId,
                  'events',
                  event.id
                ]"
                tabindex="-1"
              >
                <span
                  class="ticker-accent"
                  [style.background]="event.cover"
                ></span>

                <strong>{{ event.title }}</strong>

                <span class="ticker-meta">
                  {{ event.startTime | date: 'MM/dd HH:mm' }}
                </span>

                <span class="ticker-club">
                  {{ getClubName(event.clubId) }}
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 首頁主視覺 -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-copy">
            <span class="eyebrow">ClubWeb Community</span>

            <h1>找到你的社團，加入下一場活動</h1>

            <p>
              探索校園社團、查看近期活動與場次資訊，
              並直接完成活動報名。
            </p>

            <div class="hero-actions">
              <a class="btn primary" routerLink="/clubs">
                探索社團
              </a>

              <a class="btn secondary" routerLink="/events">
                查看所有活動
              </a>
            </div>
          </div>

          <div class="community-overview">
            <div class="overview-header">
              <div class="server-icon">CW</div>

              <div>
                <strong>ClubWeb</strong>
                <span>校園社團活動平台</span>
              </div>

              <span class="online-status">
                <span></span>
                Online
              </span>
            </div>

            <div class="stat-grid">
              <div class="stat-card">
                <strong>{{ publishedClubCount() }}</strong>
                <span>公開社團</span>
              </div>

              <div class="stat-card">
                <strong>{{ upcomingEvents().length }}</strong>
                <span>近期活動</span>
              </div>

              <div class="stat-card">
                <strong>{{ featuredEvents().length }}</strong>
                <span>推薦活動</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main class="content-shell">
        <!-- 活動清單 -->
        <section class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Upcoming Events</span>
              <h2>近期活動</h2>
              <p>查看即將舉辦的社團活動與剩餘名額。</p>
            </div>

            <a class="section-link" routerLink="/events">
              探索所有活動
              <span>→</span>
            </a>
          </div>

          <div
            class="event-list"
            *ngIf="upcomingEvents().length > 0; else emptyEvents"
          >
            <article
              class="event-row"
              *ngFor="let event of upcomingEvents(); trackBy: trackById"
            >
              <div
                class="event-date"
                [style.border-color]="event.cover"
              >
                <strong>{{ event.startTime | date: 'dd' }}</strong>
                <span>{{ event.startTime | date: 'MMM' }}</span>
              </div>

              <div class="event-info">
                <div class="event-meta-top">
                  <span class="club-badge">
                    {{ getClubName(event.clubId) }}
                  </span>

                  <span class="small-tag">
                    {{ event.category }}
                  </span>

                  <span class="ongoing-tag" *ngIf="isOngoing(event)">
                    進行中
                  </span>
                </div>

                <h3>
                  <a
                    [routerLink]="[
                      '/clubs',
                      event.clubId,
                      'events',
                      event.id
                    ]"
                  >
                    {{ event.title }}
                  </a>
                </h3>

                <div class="event-details">
                  <span class="detail-item">
                    <span class="detail-icon">◷</span>
                    {{ event.startTime | date: 'MM/dd HH:mm' }}
                  </span>

                  <span class="detail-item">
                    <span class="detail-icon">⌖</span>
                    {{ event.location }}
                  </span>

                  <span class="detail-item">
                    <span class="detail-icon">♙</span>
                    剩餘 {{ remaining(event) }} 名
                  </span>
                </div>
              </div>

              <div class="event-actions">
                <span
                  class="capacity-status"
                  [class.is-full]="remaining(event) === 0"
                >
                  {{
                    remaining(event) === 0
                      ? '已額滿'
                      : '開放報名'
                  }}
                </span>

                <a
                  class="btn small primary"
                  [routerLink]="[
                    '/clubs',
                    event.clubId,
                    'events',
                    event.id
                  ]"
                >
                  報名
                </a>

                <a
                  class="btn small discord-btn"
                  [routerLink]="[
                    '/clubs',
                    event.clubId,
                    'events',
                    event.id
                  ]"
                >
                  查看活動
                </a>
              </div>
            </article>
          </div>

          <ng-template #emptyEvents>
            <div class="empty-state">
              <div class="empty-icon">◫</div>
              <h3>目前沒有近期活動</h3>
              <p>新的活動上架後會顯示在這裡。</p>
            </div>
          </ng-template>
        </section>

        <!-- 推薦社團 -->
        <section class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Recommended Clubs</span>
              <h2>推薦社團</h2>
              <p>探索目前正在招募社員的熱門社團。</p>
            </div>

            <a class="section-link" routerLink="/clubs">
              查看所有社團
              <span>→</span>
            </a>
          </div>

          <div
            class="club-grid"
            *ngIf="recommendedClubs().length > 0; else emptyClubs"
          >
            <article
              class="club-card"
              *ngFor="let club of recommendedClubs(); trackBy: trackById"
            >
              <a
                class="club-cover"
                [routerLink]="['/clubs', club.id]"
                [style.background]="club.cover"
                [attr.aria-label]="'進入 ' + club.name"
              >
                <span class="club-logo">
                  {{ club.logo }}
                </span>
              </a>

              <div class="club-body">
                <div class="club-title-row">
                  <div>
                    <h3>
                      <a [routerLink]="['/clubs', club.id]">
                        {{ club.name }}
                      </a>
                    </h3>

                    <span class="tag">
                      {{ club.category }}
                    </span>
                  </div>

                  <span class="verified-icon" title="公開社團">
                    ✓
                  </span>
                </div>

                <p>{{ club.description }}</p>

                <div class="club-footer">
                  <span class="club-online">
                    <span></span>
                    社團開放中
                  </span>

                  <a
                    class="btn small"
                    [routerLink]="['/clubs', club.id]"
                  >
                    進入社團
                  </a>
                </div>
              </div>
            </article>
          </div>

          <ng-template #emptyClubs>
            <div class="empty-state">
              <div class="empty-icon">♙</div>
              <h3>目前沒有推薦社團</h3>
              <p>後台設定推薦社團後會顯示在這裡。</p>
            </div>
          </ng-template>
        </section>
      </main>

      <footer class="footer">
        <div class="footer-brand">
          <div class="server-icon small">CW</div>

          <div>
            <strong>ClubWeb</strong>
            <span>校園社團活動與報名平台</span>
          </div>
        </div>

        <div class="footer-links">
          <a href="mailto:club@example.edu.tw">
            club&#64;example.edu.tw
          </a>
          <span>FB</span>
          <span>IG</span>
          <span>Discord</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      color: var(--dc-text);
      background: var(--dc-bg);
    }

    * {
      box-sizing: border-box;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .home-page {
      min-height: 100vh;
      overflow: hidden;
    }

    /* 跑馬燈 */

    .announcement-strip {
      display: flex;
      align-items: stretch;
      min-height: 48px;
      background: var(--dc-header);
      border-bottom: 1px solid var(--dc-strip-border);
    }

    .announcement-label {
      position: relative;
      z-index: 2;
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1.25rem;
      color: var(--dc-white);
      background: var(--dc-blurple);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: var(--dc-white);
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgb(255 255 255 / 18%);
    }

    .ticker-window {
      min-width: 0;
      overflow: hidden;
      flex: 1;
    }

    .ticker-track {
      display: flex;
      width: max-content;
      min-width: 100%;
      animation: ticker-scroll 35s linear infinite;
    }

    .ticker-track:hover {
      animation-play-state: paused;
    }

    .ticker-group {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 0.75rem 0.45rem 0;
    }

    .ticker-item {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      min-height: 34px;
      padding: 0.35rem 0.8rem;
      color: var(--dc-text-secondary);
      background: var(--dc-surface);
      border: 1px solid var(--dc-border);
      border-radius: 0.45rem;
      font-size: 0.78rem;
      white-space: nowrap;
      transition:
        border-color 0.15s,
        background 0.15s;
    }

    .ticker-item:hover {
      background: var(--dc-surface-hover);
      border-color: var(--dc-blurple);
    }

    .ticker-item strong {
      color: var(--dc-text);
    }

    .ticker-accent {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .ticker-meta {
      color: var(--dc-text-muted);
    }

    .ticker-club {
      padding-left: 0.55rem;
      color: var(--dc-text-muted);
      border-left: 1px solid #4e5058;
    }

    @keyframes ticker-scroll {
      from {
        transform: translateX(0);
      }

      to {
        transform: translateX(-50%);
      }
    }

    /* Hero */

    .hero-section {
      padding: 4.5rem 1.5rem;
      background:
        radial-gradient(
          circle at 80% 20%,
          rgb(88 101 242 / 28%),
          transparent 33%
        ),
        radial-gradient(
          circle at 15% 80%,
          rgb(35 165 90 / 12%),
          transparent 30%
        ),
        #313338;
      border-bottom: 1px solid var(--dc-strip-border);
    }

    .hero-content {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
      gap: 3rem;
      align-items: center;
      width: min(1180px, 100%);
      margin: 0 auto;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 0.65rem;
      color: var(--dc-blurple-light);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }

    .hero-copy h1 {
      max-width: 720px;
      margin: 0;
      color: var(--dc-white);
      font-size: clamp(2.2rem, 5vw, 4rem);
      line-height: 1.05;
      letter-spacing: -0.045em;
    }

    .hero-copy p {
      max-width: 650px;
      margin: 1.35rem 0 0;
      color: var(--dc-text-muted);
      font-size: 1rem;
      line-height: 1.8;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 2rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0.65rem 1rem;
      color: var(--dc-text);
      background: var(--dc-tag-bg);
      border: 1px solid var(--dc-border);
      border-radius: 0.35rem;
      font-size: 0.85rem;
      font-weight: 700;
      transition:
        background 0.15s,
        border-color 0.15s,
        transform 0.15s;
    }

    .btn:hover {
      background: #5d6069;
      border-color: var(--dc-text-muted);
      transform: translateY(-1px);
    }

    .btn.primary {
      color: var(--dc-white);
      background: var(--dc-blurple);
      border-color: var(--dc-blurple);
    }

    .btn.primary:hover {
      background: var(--dc-blurple-dark);
      border-color: #4752c4;
    }

    .btn.secondary {
      color: var(--dc-text-secondary);
      background: var(--dc-surface);
      border-color: #4e5058;
    }

    .btn.small {
      min-height: 34px;
      padding: 0.45rem 0.75rem;
      font-size: 0.76rem;
    }

    .community-overview {
      padding: 1rem;
      background: var(--dc-surface);
      border: 1px solid var(--dc-border);
      border-radius: 0.75rem;
      box-shadow: 0 24px 60px rgb(0 0 0 / 25%);
    }

    .overview-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--dc-strip-border);
    }

    .overview-header > div:nth-child(2) {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }

    .overview-header strong {
      color: var(--dc-text);
      font-size: 0.9rem;
    }

    .overview-header span {
      color: var(--dc-text-muted);
      font-size: 0.72rem;
    }

    .server-icon {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      color: var(--dc-white);
      background: var(--dc-blurple);
      border-radius: 1rem;
      font-size: 0.8rem;
      font-weight: 900;
      transition: border-radius 0.15s;
    }

    .server-icon:hover {
      border-radius: 0.6rem;
    }

    .server-icon.small {
      width: 38px;
      height: 38px;
      border-radius: 0.75rem;
    }

    .online-status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #b5bac1 !important;
    }

    .online-status > span {
      width: 8px;
      height: 8px;
      background: var(--dc-green);
      border-radius: 50%;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.65rem;
      padding-top: 1rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      padding: 1rem 0.75rem;
      background: var(--dc-header);
      border-radius: 0.5rem;
      text-align: center;
    }

    .stat-card strong {
      color: var(--dc-white);
      font-size: 1.45rem;
    }

    .stat-card span {
      color: var(--dc-text-muted);
      font-size: 0.7rem;
    }

    /* Content */

    .content-shell {
      width: min(1180px, calc(100% - 3rem));
      margin: 0 auto;
      padding: 3.5rem 0 5rem;
    }

    .content-section + .content-section {
      margin-top: 4.5rem;
    }

    .section-heading {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 1.25rem;
    }

    .section-heading h2 {
      margin: 0;
      color: var(--dc-text);
      font-size: 1.65rem;
      line-height: 1.2;
    }

    .section-heading p {
      margin: 0.45rem 0 0;
      color: var(--dc-text-muted);
      font-size: 0.85rem;
    }

    .section-link {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 0.45rem;
      color: var(--dc-blurple-light);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .section-link:hover {
      text-decoration: underline;
    }

    /* Event list */

    .event-list {
      display: grid;
      gap: 0.6rem;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 1rem;
      background: var(--dc-surface);
      border: 1px solid transparent;
      border-radius: 0.5rem;
      transition:
        background 0.15s,
        border-color 0.15s;
    }

    .event-row:hover {
      background: var(--dc-surface-hover);
      border-color: #3f4147;
    }

    .event-date {
      display: flex;
      flex: 0 0 62px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 62px;
      background: var(--dc-header);
      border-left: 3px solid #5865f2;
      border-radius: 0.4rem;
    }

    .event-date strong {
      color: var(--dc-text);
      font-size: 1.35rem;
      line-height: 1;
    }

    .event-date span {
      margin-top: 0.3rem;
      color: var(--dc-text-muted);
      font-size: 0.66rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .event-info {
      flex: 1;
      min-width: 0;
    }

    .event-meta-top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.25rem;
    }

    .club-badge {
      color: var(--dc-blurple-light);
      font-size: 0.7rem;
      font-weight: 800;
    }

    .small-tag,
    .tag {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 0.15rem 0.45rem;
      color: var(--dc-text-secondary);
      background: var(--dc-tag-bg);
      border-radius: 999px;
      font-size: 0.64rem;
      font-weight: 700;
    }

    .ongoing-tag {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 0.15rem 0.45rem;
      color: var(--dc-white);
      background: var(--dc-red);
      border-radius: 999px;
      font-size: 0.64rem;
      font-weight: 700;
    }

    .event-info h3 {
      margin: 0;
      color: var(--dc-text);
      font-size: 0.98rem;
      line-height: 1.35;
    }

    .event-info h3 a:hover {
      text-decoration: underline;
    }

    .event-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin-top: 0.4rem;
      color: var(--dc-text-muted);
      font-size: 0.76rem;
    }

    .detail-item {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .detail-icon {
      color: var(--dc-text-muted);
    }

    .event-actions {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 0.75rem;
    }

    .capacity-status {
      color: var(--dc-green);
      font-size: 0.7rem;
      font-weight: 800;
    }

    .capacity-status.is-full {
      color: var(--dc-red);
    }

    .discord-btn {
      color: var(--dc-white);
      background: var(--dc-blurple);
      border-color: var(--dc-blurple);
    }

    .discord-btn:hover {
      background: var(--dc-blurple-dark);
      border-color: #4752c4;
    }

    /* Club cards */

    .club-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .club-card {
      min-width: 0;
      overflow: hidden;
      background: var(--dc-surface);
      border: 1px solid var(--dc-border);
      border-radius: 0.65rem;
      transition:
        transform 0.15s,
        border-color 0.15s,
        box-shadow 0.15s;
    }

    .club-card:hover {
      transform: translateY(-3px);
      border-color: var(--dc-blurple);
      box-shadow: 0 18px 32px rgb(0 0 0 / 18%);
    }

    .club-cover {
      position: relative;
      display: block;
      height: 120px;
      background-position: center !important;
      background-size: cover !important;
    }

    .club-cover::after {
      position: absolute;
      inset: 0;
      content: '';
      background:
        linear-gradient(
          to bottom,
          transparent,
          rgb(0 0 0 / 35%)
        );
    }

    .club-logo {
      position: absolute;
      z-index: 1;
      bottom: -28px;
      left: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 58px;
      height: 58px;
      color: var(--dc-white);
      background: var(--dc-header);
      border: 5px solid var(--dc-surface);
      border-radius: 1.1rem;
      font-size: 1.15rem;
      font-weight: 900;
    }

    .club-body {
      padding: 2.5rem 1rem 1rem;
    }

    .club-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .club-title-row h3 {
      margin: 0 0 0.4rem;
      color: var(--dc-text);
      font-size: 1rem;
    }

    .club-title-row h3 a:hover {
      text-decoration: underline;
    }

    .verified-icon {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--dc-white);
      background: var(--dc-blurple);
      border-radius: 50%;
      font-size: 0.65rem;
      font-weight: 900;
    }

    .club-body > p {
      min-height: 4.2em;
      margin: 1rem 0;
      overflow: hidden;
      color: var(--dc-text-muted);
      font-size: 0.8rem;
      line-height: 1.65;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }

    .club-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--dc-strip-border);
    }

    .club-online {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--dc-text-muted);
      font-size: 0.68rem;
    }

    .club-online > span {
      width: 7px;
      height: 7px;
      background: var(--dc-green);
      border-radius: 50%;
    }

    /* Empty state */

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 220px;
      padding: 2rem;
      background: var(--dc-surface);
      border: 1px dashed var(--dc-border);
      border-radius: 0.65rem;
      text-align: center;
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 54px;
      margin-bottom: 1rem;
      color: var(--dc-text-muted);
      background: var(--dc-header);
      border-radius: 50%;
      font-size: 1.4rem;
    }

    .empty-state h3 {
      margin: 0;
      color: var(--dc-text);
      font-size: 1rem;
    }

    .empty-state p {
      margin: 0.5rem 0 0;
      color: var(--dc-text-muted);
      font-size: 0.8rem;
    }

    /* Footer */

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      padding: 1.5rem max(1.5rem, calc((100% - 1180px) / 2));
      background: var(--dc-header);
      border-top: 1px solid var(--dc-strip-border);
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .footer-brand > div:last-child {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .footer-brand strong {
      color: var(--dc-text);
      font-size: 0.85rem;
    }

    .footer-brand span,
    .footer-links {
      color: var(--dc-text-muted);
      font-size: 0.72rem;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .footer-links a:hover {
      color: var(--dc-text);
      text-decoration: underline;
    }

    /* Responsive */

    @media (max-width: 900px) {
      .hero-content {
        grid-template-columns: 1fr;
      }

      .community-overview {
        max-width: 560px;
      }

      .club-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 680px) {
      .announcement-strip {
        display: block;
      }

      .announcement-label {
        min-height: 38px;
        justify-content: center;
      }

      .hero-section {
        padding: 3rem 1rem;
      }

      .hero-actions {
        display: grid;
        grid-template-columns: 1fr;
      }

      .content-shell {
        width: min(100% - 2rem, 1180px);
        padding-top: 2.5rem;
      }

      .section-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.75rem;
      }

      .event-row {
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .event-info {
        flex-basis: calc(100% - 80px);
      }

      .event-actions {
        width: 100%;
        padding-left: 78px;
        justify-content: space-between;
      }

      .club-grid {
        grid-template-columns: 1fr;
      }

      .footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    @media (max-width: 420px) {
      .stat-grid {
        grid-template-columns: 1fr;
      }

      .event-date {
        flex-basis: 54px;
        min-height: 58px;
      }

      .event-actions {
        padding-left: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ticker-window {
        overflow-x: auto;
      }

      .ticker-track {
        animation: none;
      }

      .ticker-group[aria-hidden='true'] {
        display: none;
      }

      .btn,
      .club-card {
        transition: none;
      }
    }
  `],
})
export class HomePage {
  readonly data = inject(ClubDataService);

  /**
   * 首頁跑馬燈活動。
   *
   * 後台設定 placements 包含 home_marquee 時優先顯示。
   * 如果目前資料還沒有 placements，暫時取近期活動前 5 筆。
   */
  readonly featuredEvents = computed(() => {
    const events = this.getVisibleUpcomingEvents();

    const assignedEvents = events
      .filter(event => this.hasPlacement(event, 'home_marquee'))
      .sort((a, b) => this.compareContent(a, b));

    if (assignedEvents.length > 0) {
      return assignedEvents.slice(0, 8);
    }

    return events.slice(0, 5);
  });

  /**
   * 活動列表。
   *
   * 有設定 placements 時，必須包含 home_event_list。
   * 舊資料沒有 placements 時，預設顯示。
   */
  readonly upcomingEvents = computed(() => {
    return this.getVisibleUpcomingEvents()
      .filter(event => {
        const cms = this.getCmsContent(event);

        if (!cms.placements?.length) {
          return true;
        }

        return cms.placements.includes('home_event_list');
      })
      .sort((a, b) => this.compareContent(a, b))
      .slice(0, 10);
  });

  /**
   * 推薦社團。
   *
   * 後台設定 placements 包含 home_recommended_club 時顯示。
   * 舊資料尚未有 placements 時，暫時取前三筆。
   */
  readonly recommendedClubs = computed(() => {
    const visibleClubs = this.data.clubs()
      .filter(club => this.isPublished(club))
      .sort((a, b) => this.compareContent(a, b));

    const assignedClubs = visibleClubs.filter(club =>
      this.hasPlacement(club, 'home_recommended_club')
    );

    if (assignedClubs.length > 0) {
      return assignedClubs.slice(0, 6);
    }

    return visibleClubs.slice(0, 3);
  });

  readonly publishedClubCount = computed(() => {
    return this.data.clubs()
      .filter(club => this.isPublished(club))
      .length;
  });

  getClubName(clubId: string): string {
    return this.data.clubById(clubId)?.name ?? '未知社團';
  }

  remaining(event: ClubEvent): number {
    return Math.max(event.capacity - event.currentCount, 0);
  }

  isOngoing(event: ClubEvent): boolean {
    const now = Date.now();
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    return now >= start && now <= end;
  }

  trackById(
    _index: number,
    item: Club | ClubEvent
  ): string {
    return item.id;
  }

  private getVisibleUpcomingEvents(): ClubEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.data.events()
      .filter(event => this.isPublished(event))
      .filter(event => {
        const endDate = new Date(event.endTime);

        return !Number.isNaN(endDate.getTime()) &&
          endDate.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        const sortResult = this.compareContent(a, b);

        if (sortResult !== 0) {
          return sortResult;
        }

        return new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime();
      });
  }

  private isPublished(item: Club | ClubEvent): boolean {
    const cms = this.getCmsContent(item);
    const now = Date.now();

    /**
     * 舊資料沒有 publishStatus 時先視為已發布，
     * 避免目前畫面全部消失。
     */
    if (!cms.publishStatus) {
      return true;
    }

    if (
      cms.publishStatus === 'draft' ||
      cms.publishStatus === 'archived'
    ) {
      return false;
    }

    if (cms.publishAt) {
      const publishTime = new Date(cms.publishAt).getTime();

      if (
        !Number.isNaN(publishTime) &&
        publishTime > now
      ) {
        return false;
      }
    }

    if (cms.unpublishAt) {
      const unpublishTime = new Date(cms.unpublishAt).getTime();

      if (
        !Number.isNaN(unpublishTime) &&
        unpublishTime <= now
      ) {
        return false;
      }
    }

    return cms.publishStatus === 'published' ||
      cms.publishStatus === 'scheduled';
  }

  private hasPlacement(
    item: Club | ClubEvent,
    placement: HomePlacement
  ): boolean {
    return this.getCmsContent(item)
      .placements
      ?.includes(placement) ?? false;
  }

  private compareContent(
    a: Club | ClubEvent,
    b: Club | ClubEvent
  ): number {
    const orderA = this.getCmsContent(a).sortOrder ?? 9999;
    const orderB = this.getCmsContent(b).sortOrder ?? 9999;

    return orderA - orderB;
  }

  private getCmsContent(
    item: Club | ClubEvent
  ): CmsContent {
    return item as (Club | ClubEvent) & CmsContent;
  }
}

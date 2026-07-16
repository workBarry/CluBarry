import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';

@Component({
  selector: 'app-clubs-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-heading">
      <span class="eyebrow">Clubs</span>
      <h1>社團目錄</h1>
      <p>瀏覽所有已開放的社團，找到你感興趣的社團並加入。</p>
    </section>

    <section class="section">
      <input class="search-input" type="text" placeholder="搜尋社團名稱、分類、描述..."
        [ngModel]="keyword()" (ngModelChange)="keyword.set($event)" />
      <div class="card-grid">
        <article class="club-card" *ngFor="let club of filtered()">
          <a class="club-cover"
             [routerLink]="['/clubs', club.id]"
             [style.background]="club.cover"
             [attr.aria-label]="'進入 ' + club.name">
            <span class="club-logo">{{ club.logo }}</span>
          </a>

          <div class="club-body">
            <div class="club-title-row">
              <div>
                <h3>
                  <a [routerLink]="['/clubs', club.id]">{{ club.name }}</a>
                </h3>
                <span class="tag">{{ club.category }}</span>
              </div>
              <span class="verified-icon" title="公開社團">✓</span>
            </div>

            <p>{{ club.description }}</p>

            <div class="club-footer">
              <span class="club-online" [class.pending]="club.status === 'pending'">
                <span></span>
                {{ club.status === 'pending' ? '審核中' : '社團開放中' }}
              </span>
              <a class="btn small" [routerLink]="['/clubs', club.id]">進入社團</a>
            </div>
          </div>
        </article>
        <p class="empty" *ngIf="filtered().length === 0">找不到符合的社團。</p>
      </div>
    </section>
  `,
  styles: [`
    a {
      color: inherit;
      text-decoration: none;
    }

    .search-input {
      width: 100%;
      padding: 0.65rem 1rem;
      margin-bottom: 1rem;
      border: 1px solid var(--dc-border);
      border-radius: 999px;
      background: var(--dc-input-bg);
      color: var(--dc-text);
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .search-input:focus {
      border-color: var(--dc-blurple);
      box-shadow: 0 0 0 2px var(--dc-blurple);
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
      background: linear-gradient(to bottom, transparent, rgb(0 0 0 / 35%));
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

    .club-online.pending > span {
      background: var(--dc-red);
    }

    .empty {
      grid-column: 1 / -1;
      padding: 2rem;
      color: var(--dc-text-muted);
      text-align: center;
      font-size: 0.88rem;
    }

    @media (max-width: 680px) {
      .club-cover {
        height: 100px;
      }

      .club-logo {
        width: 46px;
        height: 46px;
        bottom: -22px;
        left: 0.75rem;
        font-size: 1rem;
        border-width: 4px;
      }

      .club-body {
        padding: 2rem 0.85rem 0.85rem;
      }
    }
  `],
})
export class ClubsPage {
  readonly data = inject(ClubDataService);
  readonly keyword = signal('');

  readonly filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    if (!q) return this.data.clubs();
    return this.data.clubs().filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
    );
  });
}

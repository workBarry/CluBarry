import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubApiClientService } from '../../services/club-api-client.service';
import { MyClubResponse } from '../../services/club-api-client.service';

@Component({
  selector: 'app-my-clubs-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-heading">
      <span class="eyebrow">My Clubs</span>
      <h1>我的社團</h1>
      <p>你參與的社團與在其中的角色。</p>
    </section>

    <section class="card-grid">
      <article class="club-card" *ngFor="let row of clubs$ | async">
        <div class="club-cover" [style.background]="row.club.cover">
          <span class="club-logo">{{ row.club.logo }}</span>
        </div>
        <div class="club-body">
          <h3>{{ row.club.name }}</h3>
          <span class="tag">{{ row.role }}</span>
          <p>{{ row.club.description }}</p>
          <a class="btn small" [routerLink]="['/clubs', row.club.id]">進入社團</a>
        </div>
      </article>
      <p class="empty" *ngIf="(clubs$ | async)?.length === 0">你還沒有加入任何社團。</p>
    </section>

    <section class="section">
      <a class="btn primary" routerLink="/create-club">開立新社團</a>
    </section>
  `,
})
export class MyClubsPage {
  readonly api = inject(ClubApiClientService);

  readonly clubs$ = this.api.getMyClubs();
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Club, RoleInClub } from '../../types/club.models';

interface ClubRow {
  club: Club;
  role: RoleInClub;
}

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
  private readonly auth = inject(AuthService);
  private readonly firebase = inject(FirebaseService);

  readonly clubs$ = this.firebase.watchClubMembersByUser(this.auth.currentUser()?.id ?? '').pipe(
    switchMap((members) => {
      if (!members.length) return of<ClubRow[]>([]);
      return combineLatest(
        members.map((m) =>
          this.firebase.getClub(m.clubId).pipe(
            map((club): ClubRow | null => (club ? { club, role: m.roleInClub } : null)),
          ),
        ),
      ).pipe(map((results) => results.filter((r): r is ClubRow => r !== null)));
    }),
  );
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ClubDataService } from '../../services/club-data.service';
import { FirebaseService } from '../../services/firebase.service';
import { Club, ClubEvent, ClubMember, ClubUser, RoleInClub } from '../../types/club.models';

interface MemberRow {
  member: ClubMember;
  user: ClubUser | undefined;
}

@Component({
  selector: 'app-club-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="detail-banner tall" *ngIf="club() as c; else missing" [style.background]="c.cover">
      <span>{{ c.category }}</span>
      <h1>{{ c.name }}</h1>
      <p>{{ c.description }}</p>
      <div class="banner-actions" *ngIf="auth.currentUser() as user">
        <button *ngIf="applyState() === 'none'" type="button" class="btn secondary" (click)="applyToJoin()">申請入社</button>
        <span *ngIf="applyState() === 'pending'" class="tag pending-tag">已申請，等待審核</span>
        <button *ngIf="applyState() === 'active'" type="button" class="btn danger" (click)="leaveClub()">退出社團</button>
      </div>
      <div class="banner-actions" *ngIf="!auth.currentUser()">
        <a class="btn secondary" routerLink="/login">登入後申請入社</a>
      </div>
    </section>

    <ng-template #missing>
      <section class="empty-state"><h1>找不到社團</h1><a class="btn secondary" routerLink="/">回首頁</a></section>
    </ng-template>

    <section class="section" *ngIf="club() as c">
      <div class="section-heading">
        <div><span class="eyebrow">Events</span><h2>{{ c.name }} 的活動</h2></div>
      </div>
      <div class="event-list">
        <article class="event-row" *ngFor="let event of events">
          <span class="event-accent" [style.background]="event.cover"></span>
          <div class="event-info">
            <span class="tag small-tag">{{ event.category }}</span>
            <h3>{{ event.title }}</h3>
            <p>{{ event.description }}</p>
          </div>
          <a class="btn small discord-btn" [routerLink]="['/clubs', c.id, 'events', event.id]">場次與報名</a>
        </article>
        <p class="empty" *ngIf="events.length === 0">此社團尚無已開放的活動。</p>
      </div>
    </section>

    <section class="section" *ngIf="club() as c">
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

    <section class="section" *ngIf="club() as c">
      <div class="section-heading">
        <div><span class="eyebrow">Members</span><h2>社員管理</h2></div>
        <span class="tag">{{ memberRows().length }} 人</span>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>Email</th>
              <th>職位</th>
              <th>狀態</th>
              <th *ngIf="canManage">功能</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of memberRows()">
              <td><span class="avatar">{{ row.user?.avatar }}</span>{{ row.user?.name }}</td>
              <td>{{ row.user?.email }}</td>
              <td>
                <select *ngIf="canManage" [ngModel]="row.member.roleInClub"
                  (ngModelChange)="saveRole(row.member, $event)">
                  <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
                </select>
                <span *ngIf="!canManage">{{ row.member.roleInClub }}</span>
              </td>
              <td><span class="status-pill">{{ row.member.status }}</span></td>
              <td class="actions" *ngIf="canManage">
                <button type="button" class="btn small primary" *ngIf="row.member.status === 'pending'"
                  (click)="approve(row.member)">同意</button>
                <button type="button" class="btn small danger" *ngIf="row.member.status === 'pending'"
                  (click)="reject(row.member)">拒絕</button>
                <button type="button" class="btn small danger" *ngIf="row.member.status !== 'pending'"
                  (click)="remove(row.member)">移除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="empty" *ngIf="memberRows().length === 0">此社團尚無成員。</p>
      </div>
      <p class="notice" *ngIf="message">{{ message }}</p>
    </section>
  `,
  styles: [`
    .banner-actions {
      margin-top: 0.75rem;
    }
    .pending-tag {
      color: var(--warning);
      background: #fff7ed;
    }
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
    .event-info h3 {
      margin-bottom: 0.15rem;
      color: #f2f3f5;
      font-size: 0.92rem;
      line-height: 1.3;
    }
    .event-info p {
      margin: 0;
      color: #b5bac1;
      font-size: 0.8rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .small-tag {
      padding: 0.15rem 0.45rem;
      font-size: 0.68rem;
      color: #dbdee1;
      background: #4e5058;
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
    .table-card {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 0.9rem;
      background: var(--surface);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--line);
      white-space: nowrap;
    }
    th {
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #f9fbfd;
    }
    td { vertical-align: middle; }
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      margin-right: 0.5rem;
      border-radius: 50%;
      color: #fff;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      font-size: 0.72rem;
      font-weight: 800;
      vertical-align: middle;
    }
    .status-pill {
      display: inline-flex;
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary-strong);
      background: #e7f5ed;
    }
    .actions { white-space: nowrap; }
    .actions .btn + .btn { margin-left: 0.4rem; }
    .notice {
      margin-top: 0.75rem;
      color: var(--primary);
      font-weight: 700;
    }
    select {
      min-height: 2.2rem;
      border: 1px solid var(--line);
      border-radius: 0.5rem;
      padding: 0 0.5rem;
      font-size: 0.86rem;
    }
  `],
})
export class ClubPage implements OnDestroy {
  readonly data = inject(ClubDataService);
  readonly auth = inject(AuthService);
  readonly firebase = inject(FirebaseService);
  private readonly route = inject(ActivatedRoute);
  private userSubs: Subscription[] = [];

  readonly club = computed(() => this.data.clubById(this.route.snapshot.paramMap.get('cid')));
  readonly memberRows = signal<MemberRow[]>([]);
  readonly roles: RoleInClub[] = ['President', 'Officer', 'Member'];
  message = '';

  get canManage(): boolean {
    const c = this.club();
    if (!c) return false;
    const role = this.data.myRoleInClub(c.id);
    return role === 'President' || role === 'Officer';
  }

  get events(): ClubEvent[] {
    const c = this.club();
    return c ? this.data.eventsByClub(c.id) : [];
  }

  get announcements() {
    const c = this.club();
    return c ? this.data.announcementsByClub(c.id) : [];
  }

  applyState = signal<'none' | 'pending' | 'active'>('none');
  private myMemberId = '';

  constructor() {
    effect((onCleanup) => {
      const c = this.club();
      if (!c) return;

      this.userSubs.forEach((s) => s.unsubscribe());
      this.userSubs = [];

      const memberSub = this.firebase.watchClubMembers(c.id).subscribe({
        next: (members) => {
          this.userSubs.forEach((s) => s.unsubscribe());
          this.userSubs = [];
          const rows: MemberRow[] = members.map((m) => ({ member: m, user: undefined }));
          this.memberRows.set(rows);
          members.forEach((m, i) => {
            const sub = this.firebase.getUser(m.userId).subscribe({
              next: (user) => {
                this.memberRows.update((prev) =>
                  prev.map((r, idx) => idx === i ? { ...r, user } : r),
                );
              },
            });
            this.userSubs.push(sub);
          });

          const userId = this.auth.currentUser()?.id;
          if (userId) {
            const my = members.find((m) => m.userId === userId);
            if (!my) {
              this.myMemberId = '';
              this.applyState.set('none');
            } else if (my.status === 'pending') {
              this.myMemberId = my.id;
              this.applyState.set('pending');
            } else {
              this.myMemberId = my.id;
              this.applyState.set('active');
            }
          }
        },
      });

      onCleanup(() => {
        memberSub.unsubscribe();
        this.userSubs.forEach((s) => s.unsubscribe());
        this.userSubs = [];
      });
    });
  }

  ngOnDestroy(): void {}

  applyToJoin(): void {
    const user = this.auth.currentUser();
    const c = this.club();
    if (!user || !c) return;
    this.firebase.createClubMember({
      userId: user.id,
      clubId: c.id,
      roleInClub: 'Member',
      status: 'pending',
      joinedAt: new Date().toISOString(),
    });
    this.applyState.set('pending');
    this.message = '申請已送出，等待社團幹部審核。';

    const president = this.memberRows().find(
      (r) => r.member.roleInClub === 'President' && r.member.status === 'active',
    );
    if (president) {
      this.firebase.createNotification({
        userId: president.member.userId,
        title: '入社申請',
        content: `${user.name} 申請加入「${c.name}」，請至後台審核。`,
        type: 'review',
        isRead: false,
      });
    }
  }

  saveRole(member: ClubMember, role: RoleInClub): void {
    this.firebase.updateClubMember(member.id, { roleInClub: role });
    this.message = `已將成員職位更新為 ${role}。`;
  }

  leaveClub(): void {
    if (!confirm('確定要退出此社團嗎？')) return;
    if (!this.myMemberId) return;
    this.firebase.deleteClubMember(this.myMemberId);
    this.applyState.set('none');
    this.myMemberId = '';
    this.message = '已退出社團。';
  }

  approve(member: ClubMember): void {
    const approverName = this.auth.currentUser()?.name || '管理員';
    const now = new Date().toISOString();
    this.firebase.updateClubMember(member.id, {
      status: 'active',
      approvedBy: approverName,
      approvedAt: now,
    });
    this.firebase.createNotification({
      userId: member.userId,
      title: '入社申請已通過',
      content: `你申請的社團已通過審核，歡迎加入！`,
      type: 'review',
      isRead: false,
    });
    this.message = '已同意成員加入社團。';
  }

  reject(member: ClubMember): void {
    if (!confirm('確定要拒絕此成員的申請嗎？')) return;
    this.firebase.deleteClubMember(member.id);
    this.firebase.createNotification({
      userId: member.userId,
      title: '入社申請未通過',
      content: `你申請的社團未通過審核，如有疑問請聯繫社團幹部。`,
      type: 'review',
      isRead: false,
    });
    this.message = '已拒絕成員的入社申請。';
  }

  remove(member: ClubMember): void {
    if (!confirm('確定要將此成員移出社團嗎？')) return;
    this.firebase.deleteClubMember(member.id);
    this.message = '已將成員移出社團。';
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ClubDataService } from '../../services/club-data.service';
import { ApiService } from '../../services/api.service';
import { Club, ClubEvent, ClubMember, ClubUser, Registration, RoleInClub } from '../../types/club.models';

interface MemberRow {
  member: ClubMember;
  user: ClubUser | undefined;
}

@Component({
  selector: 'app-club-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="detail-banner tall" *ngIf="club() as c; else missing" [style.background]="c.cover">
      <button *ngIf="canManage()" class="gear-btn" (click)="openEditClub()" title="編輯社團">&#9881;</button>
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

    <ng-container *ngIf="club() as c">
    <section class="section">
      <div class="tabs">
        <button [class.active]="activeTab() === 'events'" (click)="activeTab.set('events')">活動</button>
        <button [class.active]="activeTab() === 'announcements'" (click)="activeTab.set('announcements')">公告</button>
        <button [class.active]="activeTab() === 'members'" (click)="activeTab.set('members')">社員</button>
      </div>
    </section>

    <section class="section" *ngIf="activeTab() === 'events'">
      <div class="section-heading">
        <div><span class="eyebrow">Events</span><h2>{{ c.name }} 的活動</h2></div>
        <button *ngIf="canManage()" class="btn small discord-btn" (click)="showEventForm.set(true)">+ 建立活動</button>
      </div>

      <div class="event-list">
        <article class="event-row" *ngFor="let event of events">
          <span class="event-accent" [style.background]="event.cover"></span>
          <div class="event-info">
            <span class="tag small-tag">{{ event.category }}</span>
            <h3>{{ event.title }}</h3>
            <p>{{ event.description }}</p>
            <small class="event-date">{{ event.startTime | date:'MM/dd HH:mm' }} - {{ event.endTime | date:'MM/dd HH:mm' }}</small>
          </div>
          <a class="btn small discord-btn" [routerLink]="['/clubs', c.id, 'events', event.id]">場次與報名</a>
        </article>
        <p class="empty" *ngIf="events.length === 0">此社團尚無已開放的活動。</p>
      </div>
    </section>

    <section class="section" *ngIf="activeTab() === 'announcements'">
      <div class="section-heading">
        <div><span class="eyebrow">Announcements</span><h2>社團公告</h2></div>
        <button *ngIf="canManage()" class="btn small discord-btn" (click)="showAnnouncementForm.set(true)">+ 建立公告</button>
      </div>

      <div class="announcement-list">
        <article class="announcement-item" *ngFor="let a of announcements">
          <span class="pin" *ngIf="a.isPinned">置頂</span>
          <div class="announcement-head">
            <div>
              <strong>{{ a.title }}</strong>
              <small>{{ a.category }} / {{ a.createdAt | date:'yyyy/MM/dd' }}</small>
            </div>
            <div class="announcement-actions" *ngIf="canManage()">
              <div class="menu-wrap">
                <button class="icon-btn" (click)="openAnnouncementMenu(a.id, $event)">&#9998;</button>
                <div class="dropdown-menu" *ngIf="announcementMenuId() === a.id">
                  <button (click)="togglePin(a)">{{ a.isPinned ? '取消置頂' : '置頂' }}</button>
                  <button (click)="openEditAnnouncement(a)">編輯</button>
                  <button class="danger" (click)="deleteAnnouncement(a)">刪除</button>
                </div>
              </div>
            </div>
          </div>
          <p>{{ a.content }}</p>
        </article>
        <p class="empty" *ngIf="announcements.length === 0">尚無公告。</p>
      </div>
    </section>

    <section class="section" *ngIf="activeTab() === 'members'">
      <div class="section-heading">
        <div><span class="eyebrow">Members</span><h2>社員管理</h2></div>
        <div class="heading-actions">
          <span class="tag">{{ activeMemberCount() }} 人</span>
          <button *ngIf="canManage()" class="btn small" (click)="editingId.set(editingId() ? '' : 'edit')">
            {{ editingId() ? '完成' : '編輯' }}
          </button>
          <button *ngIf="canManage()" class="btn small discord-btn" (click)="showApplyDialog.set(true)">
            入社申請 <span class="badge" *ngIf="pendingMembers().length">{{ pendingMembers().length }}</span>
          </button>
        </div>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>Email</th>
              <th>職位</th>
              <th *ngIf="canManage()">功能</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of activeMemberRows()">
              <td><span class="avatar">{{ row.user?.avatar }}</span>{{ row.user?.name }}</td>
              <td>{{ row.user?.email }}</td>
              <td>
                <select *ngIf="canManage() && editingId()" [ngModel]="row.member.roleInClub"
                  (ngModelChange)="saveRole(row.member, $event)">
                  <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
                </select>
                <span *ngIf="!canManage() || !editingId()">{{ row.member.roleInClub }}</span>
              </td>
              <td class="actions" *ngIf="canManage() && editingId()">
                <button type="button" class="btn small danger" (click)="remove(row.member)">移除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="empty" *ngIf="activeMemberRows().length === 0">此社團尚無成員。</p>
      </div>

      <ng-container *ngIf="canManage() && pendingRegs().length > 0">
        <div class="section-heading" style="margin-top:1.5rem">
          <div><span class="eyebrow">Registrations</span><h2>報名審核</h2></div>
          <span class="tag">{{ pendingRegs().length }} 筆待審核</span>
        </div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>申請人</th>
                <th>場次</th>
                <th>時間</th>
                <th>功能</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reg of pendingRegs()">
                <td>{{ getUserName(reg.userId) }}</td>
                <td>{{ getSessionTitle(reg.sessionId) }}</td>
                <td>{{ getSessionTime(reg.sessionId) }}</td>
                <td class="actions">
                  <button type="button" class="btn small primary" (click)="approveReg(reg)">同意</button>
                  <button type="button" class="btn small danger" (click)="rejectReg(reg)">拒絕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <p class="notice" *ngIf="message">{{ message }}</p>
    </section>

    <!-- 入社申請 Dialog -->
    <div class="dialog-backdrop" *ngIf="showApplyDialog()" (click)="showApplyDialog.set(false)"></div>
    <div class="dialog" *ngIf="showApplyDialog()">
      <div class="dialog-header">
        <h3>入社申請</h3>
        <button class="dialog-close" (click)="showApplyDialog.set(false)">&times;</button>
      </div>
      <div class="dialog-body">
        <div class="apply-list" *ngIf="pendingMembers().length > 0">
          <div class="apply-item" *ngFor="let row of pendingMembers()">
            <div class="apply-user">
              <span class="avatar">{{ row.user?.avatar }}</span>
              <div>
                <strong>{{ row.user?.name }}</strong>
                <small>{{ row.user?.email }}</small>
              </div>
            </div>
            <div class="apply-actions">
              <button class="btn small primary" (click)="approve(row.member)">同意</button>
              <button class="btn small danger" (click)="reject(row.member)">拒絕</button>
            </div>
          </div>
        </div>
        <p class="empty" *ngIf="pendingMembers().length === 0">目前沒有待審核的申請。</p>
      </div>
    </div>

    <!-- 編輯社團 Dialog -->
    <div class="dialog-backdrop" *ngIf="showEditClub()" (click)="showEditClub.set(false)"></div>
    <div class="dialog" *ngIf="showEditClub()">
      <div class="dialog-header">
        <h3>編輯社團</h3>
        <button class="dialog-close" (click)="showEditClub.set(false)">&times;</button>
      </div>
      <div class="dialog-body">
        <label>社團名稱<input [(ngModel)]="editClubForm.name" /></label>
        <label>封面圖片 URL<input [(ngModel)]="editClubForm.cover" placeholder="https://..." /></label>
        <label>分類<input [(ngModel)]="editClubForm.category" /></label>
        <label>描述<textarea [(ngModel)]="editClubForm.description" rows="3"></textarea></label>
        <label>標籤（逗號分隔）<input [(ngModel)]="editClubForm.tags" placeholder="React, Angular, Vue" /></label>
        <div class="dialog-actions">
          <button class="btn danger" (click)="showDissolveConfirm.set(true)">廢棄社團</button>
          <div>
            <button class="btn secondary" (click)="showEditClub.set(false)">取消</button>
            <button class="btn primary" (click)="saveClubInfo()" [disabled]="!editClubForm.name">儲存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 廢棄社團確認 Dialog -->
    <div class="dialog-backdrop" *ngIf="showDissolveConfirm()" (click)="showDissolveConfirm.set(false)"></div>
    <div class="dialog" *ngIf="showDissolveConfirm()">
      <div class="dialog-header">
        <h3>確認廢棄社團</h3>
        <button class="dialog-close" (click)="showDissolveConfirm.set(false)">&times;</button>
      </div>
      <div class="dialog-body">
        <p class="dissolve-warning">廢棄社團後無法復原，所有活動、公告、社員資料都會被清除。請輸入社團名稱確認：</p>
        <input [(ngModel)]="dissolveInput" [placeholder]="club()?.name" />
        <div class="dialog-actions">
          <button class="btn secondary" (click)="showDissolveConfirm.set(false)">取消</button>
          <button class="btn danger" (click)="dissolveClub()" [disabled]="dissolveInput !== club()?.name">確認廢棄</button>
        </div>
      </div>
    </div>

    <!-- 建立活動 Dialog -->
    <div class="dialog-backdrop" *ngIf="showEventForm()" (click)="showEventForm.set(false)"></div>
    <div class="dialog wide" *ngIf="showEventForm()">
      <div class="dialog-header">
        <h3>建立活動</h3>
        <button class="dialog-close" (click)="showEventForm.set(false)">&times;</button>
      </div>
      <div class="dialog-body">
        <label>活動名稱<input [(ngModel)]="newEvent.title" /></label>
        <label>分類（例：工作坊）<input [(ngModel)]="newEvent.category" /></label>
        <label>描述<textarea [(ngModel)]="newEvent.description" rows="2"></textarea></label>
        <label>地點<input [(ngModel)]="newEvent.location" /></label>
        <div class="form-row">
          <label>開始時間<input type="datetime-local" [(ngModel)]="newEvent.startTime" /></label>
          <label>結束時間<input type="datetime-local" [(ngModel)]="newEvent.endTime" /></label>
        </div>
        <div class="form-row">
          <label>報名截止<input type="datetime-local" [(ngModel)]="newEvent.deadline" /></label>
          <label>名額<input type="number" [(ngModel)]="newEvent.capacity" min="1" /></label>
        </div>
        <p class="notice" *ngIf="eventFormMsg">{{ eventFormMsg }}</p>
        <div class="dialog-actions">
          <div></div>
          <div>
            <button class="btn secondary" (click)="showEventForm.set(false)">取消</button>
            <button class="btn primary" (click)="createEvent()" [disabled]="!newEvent.title || !newEvent.startTime || !newEvent.endTime">建立</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 建立公告 Dialog -->
    <div class="dialog-backdrop" *ngIf="showAnnouncementForm()" (click)="showAnnouncementForm.set(false)"></div>
    <div class="dialog" *ngIf="showAnnouncementForm()">
      <div class="dialog-header">
        <h3>建立公告</h3>
        <button class="dialog-close" (click)="showAnnouncementForm.set(false)">&times;</button>
      </div>
      <div class="dialog-body">
        <label>公告標題<input [(ngModel)]="newAnnouncement.title" /></label>
        <label>分類（例：重要）<input [(ngModel)]="newAnnouncement.category" /></label>
        <label>內容<textarea [(ngModel)]="newAnnouncement.content" rows="4"></textarea></label>
        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="newAnnouncement.isPinned" />
          <span>置頂公告</span>
        </label>
        <p class="notice" *ngIf="announcementFormMsg">{{ announcementFormMsg }}</p>
        <div class="dialog-actions">
          <div></div>
          <div>
            <button class="btn secondary" (click)="showAnnouncementForm.set(false)">取消</button>
            <button class="btn primary" (click)="createAnnouncement()" [disabled]="!newAnnouncement.title || !newAnnouncement.content">建立</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 編輯公告 Dialog -->
    <div class="dialog-backdrop" *ngIf="showEditAnnouncement()" (click)="showEditAnnouncement.set(false)"></div>
    <div class="dialog" *ngIf="showEditAnnouncement()">
      <div class="dialog-header">
        <h3>編輯公告</h3>
        <button class="dialog-close" (click)="showEditAnnouncement.set(false)">&times;</button>
      </div>
      <div class="dialog-body">
        <label>公告標題<input [(ngModel)]="editAnnouncementForm.title" /></label>
        <label>分類<input [(ngModel)]="editAnnouncementForm.category" /></label>
        <label>內容<textarea [(ngModel)]="editAnnouncementForm.content" rows="4"></textarea></label>
        <div class="dialog-actions">
          <div></div>
          <div>
            <button class="btn secondary" (click)="showEditAnnouncement.set(false)">取消</button>
            <button class="btn primary" (click)="saveAnnouncement()" [disabled]="!editAnnouncementForm.title">儲存</button>
          </div>
        </div>
      </div>
    </div>
    </ng-container>
  `,
  styles: [`
    .banner-actions {
      margin-top: 0.75rem;
    }
    .pending-tag {
      color: var(--warning);
      background: var(--badge-orange-bg);
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
      background: var(--surface);
      border: 1px solid var(--line);
      transition: background 0.15s;
    }
    .event-row:hover {
      background: var(--nav-hover);
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
      color: var(--text);
      font-size: 0.92rem;
      line-height: 1.3;
    }
    .event-info p {
      margin: 0;
      color: var(--muted);
      font-size: 0.8rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .event-date {
      display: block;
      margin-top: 0.2rem;
      color: var(--muted);
      font-size: 0.75rem;
    }
    .small-tag {
      padding: 0.15rem 0.45rem;
      font-size: 0.68rem;
      color: var(--text);
      background: var(--line);
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
      box-shadow: var(--card-shadow);
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
      background: var(--table-header-bg);
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
    .create-form {
      display: grid;
      gap: 0.6rem;
      margin-bottom: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
      background: var(--form-bg);
      border: 1px solid var(--line);
    }
    .create-form input,
    .create-form textarea {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--line);
      border-radius: 0.5rem;
      font-size: 0.88rem;
      font-family: inherit;
    }
    .form-row {
      display: flex;
      gap: 0.75rem;
    }
    .form-row label {
      flex: 1;
      display: grid;
      gap: 0.3rem;
      font-size: 0.82rem;
      color: var(--muted);
      font-weight: 600;
    }
    .form-row input {
      width: 100%;
    }
    .checkbox-label {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.86rem;
      color: var(--muted);
      cursor: pointer;
    }
    .checkbox-label input {
      width: auto;
    }
    .heading-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      display: inline-grid;
      place-items: center;
      min-width: 1.2rem;
      height: 1.2rem;
      margin-left: 0.35rem;
      padding: 0 0.3rem;
      border-radius: 999px;
      background: var(--dc-red);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
    }
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: var(--dc-overlay);
      z-index: 200;
    }
    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(440px, calc(100% - 2rem));
      max-height: 80vh;
      border-radius: 0.75rem;
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      z-index: 201;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .dialog.wide { width: min(540px, calc(100% - 2rem)); }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--line);
    }
    .dialog-header h3 { margin: 0; }
    .dialog-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: var(--muted);
      line-height: 1;
    }
    .dialog-body {
      padding: 1rem 1.25rem;
      overflow-y: auto;
    }
    .apply-list {
      display: grid;
      gap: 0.5rem;
    }
    .apply-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--line);
      border-radius: 0.5rem;
      background: var(--form-bg);
    }
    .apply-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .apply-user strong {
      display: block;
      font-size: 0.88rem;
    }
    .apply-user small {
      color: var(--muted);
      font-size: 0.78rem;
    }
    .apply-actions {
      display: flex;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    .gear-btn {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 2.2rem;
      height: 2.2rem;
      border: none;
      border-radius: 50%;
      background: rgba(0,0,0,0.45);
      color: #fff;
      font-size: 1.15rem;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: background 0.15s;
      &:hover { background: rgba(0,0,0,0.7); }
    }
    .detail-banner { position: relative; }
    .dialog-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
    }
    .dialog-actions .btn + .btn { margin-left: 0.4rem; }
    .dissolve-warning {
      color: var(--danger);
      font-size: 0.88rem;
      margin-bottom: 0.75rem;
    }
    .dialog-body > input {
      width: 100%;
      padding: 0.55rem 0.8rem;
      border: 1px solid var(--line);
      border-radius: 0.5rem;
      background: var(--input-bg);
      color: var(--text);
      font-size: 0.88rem;
    }
    .dialog-body > label {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--muted);
    }
    .dialog-body > label + label { margin-top: 0.6rem; }
    .dialog-body > label.checkbox-label {
      flex-direction: row;
      font-weight: normal;
    }
    .dialog-body textarea {
      resize: vertical;
    }
    .announcement-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .announcement-actions {
      flex-shrink: 0;
    }
    .menu-wrap {
      position: relative;
    }
    .icon-btn {
      display: grid;
      place-items: center;
      width: 1.8rem;
      height: 1.8rem;
      border: none;
      border-radius: 0.35rem;
      background: transparent;
      color: var(--muted);
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
    }
    .icon-btn:hover {
      background: var(--nav-hover);
      color: var(--text);
    }
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.25rem;
      min-width: 100px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 0.45rem;
      box-shadow: var(--shadow);
      z-index: 50;
      overflow: hidden;
    }
    .dropdown-menu button {
      display: block;
      width: 100%;
      padding: 0.45rem 0.75rem;
      border: none;
      background: none;
      color: var(--text);
      font-size: 0.82rem;
      text-align: left;
      cursor: pointer;
      white-space: nowrap;
    }
    .dropdown-menu button:hover {
      background: var(--nav-hover);
    }
    .dropdown-menu button.danger {
      color: var(--danger);
    }
  `],
})
export class ClubPage implements OnDestroy {
  readonly data = inject(ClubDataService);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private userSubs: Subscription[] = [];

  readonly club = computed(() => this.data.clubById(this.route.snapshot.paramMap.get('cid')));
  readonly memberRows = signal<MemberRow[]>([]);
  readonly activeTab = signal<'events' | 'announcements' | 'members'>('events');
  readonly canManage = computed(() => {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;
    return this.memberRows().some(
      (r) => r.member.userId === userId && r.member.roleInClub === 'President' && r.member.status === 'active',
    );
  });
  readonly roles: RoleInClub[] = ['President', 'Officer', 'Member'];
  showApplyDialog = signal(false);
  editingId = signal('');
  showEditClub = signal(false);
  showDissolveConfirm = signal(false);
  showEditAnnouncement = signal(false);
  announcementMenuId = signal('');
  dissolveInput = '';
  private closeMenuHandler!: () => void;
  editClubForm = { name: '', cover: '', description: '', category: '', tags: '' };
  editAnnouncementForm = { id: '', title: '', category: '', content: '', isPinned: false };
  message = '';

  readonly pendingMembers = computed(() => this.memberRows().filter((r) => r.member.status === 'pending'));
  readonly activeMemberRows = computed(() => this.memberRows().filter((r) => r.member.status === 'active'));
  readonly activeMemberCount = computed(() => this.activeMemberRows().length);

  get events(): ClubEvent[] {
    const c = this.club();
    return c ? this.data.eventsByClub(c.id) : [];
  }

  get announcements() {
    const c = this.club();
    return c ? this.data.announcementsByClub(c.id) : [];
  }

  readonly pendingRegs = computed(() => {
    const c = this.club();
    return c ? this.data.pendingRegistrations(c.id) : [];
  });

  applyState = signal<'none' | 'pending' | 'active'>('none');
  showEventForm = signal(false);
  showAnnouncementForm = signal(false);
  eventFormMsg = '';
  announcementFormMsg = '';
  private myMemberId = '';

  newEvent = {
    title: '',
    category: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    deadline: '',
    capacity: 20,
  };

  newAnnouncement = {
    title: '',
    category: '',
    content: '',
    isPinned: false,
  };

  constructor() {
    this.closeMenuHandler = () => this.announcementMenuId.set('');
    document.addEventListener('click', this.closeMenuHandler);
    effect((onCleanup) => {
      const c = this.club();
      if (!c) return;

      this.userSubs.forEach((s) => s.unsubscribe());
      this.userSubs = [];

      const memberSub = this.api.getClubMembers(c.id).subscribe({
        next: (members) => {
          this.userSubs.forEach((s) => s.unsubscribe());
          this.userSubs = [];
          const rows: MemberRow[] = members.map((m) => ({ member: m, user: undefined }));
          this.memberRows.set(rows);
          members.forEach((m) => {
            const sub = this.api.getUser(m.userId).subscribe({
              next: (user) => {
                this.memberRows.update((prev) =>
                  prev.map((r) => r.member.id === m.id ? { ...r, user } : r),
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

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeMenuHandler);
  }

  applyToJoin(): void {
    const user = this.auth.currentUser();
    const c = this.club();
    if (!user || !c) return;
    this.api.createMember({
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
      this.api.createNotification({
        userId: president.member.userId,
        title: '入社申請',
        content: `${user.name} 申請加入「${c.name}」，請至後台審核。`,
        type: 'review',
        isRead: false,
      });
    }
  }

  saveRole(member: ClubMember, role: RoleInClub): void {
    this.api.updateMember(member.id, { roleInClub: role });
    this.message = `已將成員職位更新為 ${role}。`;
  }

  leaveClub(): void {
    if (!confirm('確定要退出此社團嗎？')) return;
    if (!this.myMemberId) return;
    this.api.deleteMember(this.myMemberId);
    this.applyState.set('none');
    this.myMemberId = '';
    this.message = '已退出社團。';
  }

  approve(member: ClubMember): void {
    const approverName = this.auth.currentUser()?.name || '管理員';
    const now = new Date().toISOString();
    this.api.updateMember(member.id, {
      status: 'active',
      approvedBy: approverName,
      approvedAt: now,
    });
    this.api.createNotification({
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
    this.api.deleteMember(member.id);
    this.api.createNotification({
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
    this.api.deleteMember(member.id);
    this.message = '已將成員移出社團。';
  }

  approveReg(reg: Registration): void {
    this.data.approveRegistration(reg);
  }

  rejectReg(reg: Registration): void {
    if (!confirm('確定要拒絕此報名申請嗎？')) return;
    this.data.rejectRegistration(reg);
  }

  createEvent(): void {
    const c = this.club();
    if (!c) return;
    const payload: Record<string, unknown> = {
      clubId: c.id,
      title: this.newEvent.title,
      category: this.newEvent.category || '一般',
      description: this.newEvent.description,
      cover: '#5865f2',
      agenda: [],
      location: this.newEvent.location,
      startTime: new Date(this.newEvent.startTime).toISOString(),
      endTime: new Date(this.newEvent.endTime).toISOString(),
      capacity: this.newEvent.capacity,
      currentCount: 0,
      tags: [],
      status: 'published',
      createdBy: this.auth.currentUser()?.id ?? '',
    };
    if (this.newEvent.deadline) {
      payload['deadline'] = new Date(this.newEvent.deadline).toISOString();
    }
    this.api.createEvent(payload as Omit<ClubEvent, 'id' | 'createdAt'>).subscribe({
      next: () => {
        this.eventFormMsg = '活動已建立。';
        this.showEventForm.set(false);
        this.newEvent = { title: '', category: '', description: '', location: '', startTime: '', endTime: '', deadline: '', capacity: 20 };
      },
      error: (err) => {
        console.error('建立活動失敗:', err);
        this.eventFormMsg = '建立失敗，請稍後再試。';
      },
    });
  }

  createAnnouncement(): void {
    const c = this.club();
    if (!c) return;
    this.api.createAnnouncement({
      clubId: c.id,
      title: this.newAnnouncement.title,
      category: this.newAnnouncement.category || '一般',
      content: this.newAnnouncement.content,
      cover: '#5865f2',
      isPinned: this.newAnnouncement.isPinned,
      status: 'published',
      createdBy: this.auth.currentUser()?.id ?? '',
    });
    this.announcementFormMsg = '公告已建立。';
    this.showAnnouncementForm.set(false);
    this.newAnnouncement = { title: '', category: '', content: '', isPinned: false };
  }

  getUserName(userId: string): string {
    const row = this.memberRows().find((r) => r.member.userId === userId);
    return row?.user?.name ?? userId;
  }

  getSessionTitle(sessionId: string): string {
    const s = this.data.sessionById(sessionId);
    return s?.title ?? '—';
  }

  getSessionTime(sessionId: string): string {
    const s = this.data.sessionById(sessionId);
    if (!s) return '';
    const fmt = (d: string) => new Date(d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `${fmt(s.startTime)} - ${new Date(s.endTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
  }

  openEditClub(): void {
    const c = this.club();
    if (!c) return;
    this.editClubForm = {
      name: c.name,
      cover: c.cover,
      description: c.description,
      category: c.category,
      tags: c.tags.join(', '),
    };
    this.showEditClub.set(true);
  }

  async saveClubInfo(): Promise<void> {
    const c = this.club();
    if (!c) return;
    await this.data.updateClub(c.id, {
      name: this.editClubForm.name,
      cover: this.editClubForm.cover,
      description: this.editClubForm.description,
      category: this.editClubForm.category,
      tags: this.editClubForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    this.showEditClub.set(false);
  }

  async dissolveClub(): Promise<void> {
    const c = this.club();
    if (!c) return;
    await this.data.closeClub(c.id);
    window.location.href = '/';
  }

  openEditAnnouncement(a: { id: string; title: string; category: string; content: string; isPinned: boolean }): void {
    this.announcementMenuId.set('');
    this.editAnnouncementForm = { id: a.id, title: a.title, category: a.category, content: a.content, isPinned: a.isPinned };
    this.showEditAnnouncement.set(true);
  }

  async saveAnnouncement(): Promise<void> {
    const f = this.editAnnouncementForm;
    await this.data.updateAnnouncement(f.id, {
      title: f.title,
      category: f.category,
      content: f.content,
      isPinned: f.isPinned,
    });
    this.showEditAnnouncement.set(false);
  }

  async deleteAnnouncement(a: { id: string; title: string }): Promise<void> {
    this.announcementMenuId.set('');
    if (!confirm(`確定要刪除「${a.title}」嗎？`)) return;
    await this.data.deleteAnnouncement(a.id);
  }

  async togglePin(a: { id: string; isPinned: boolean }): Promise<void> {
    this.announcementMenuId.set('');
    await this.data.updateAnnouncement(a.id, { isPinned: !a.isPinned });
  }

  openAnnouncementMenu(id: string, e: Event): void {
    e.stopPropagation();
    this.announcementMenuId.set(this.announcementMenuId() === id ? '' : id);
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClubDataService } from '../../services/club-data.service';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading">
      <span class="eyebrow">Profile</span>
      <h1>個人中心</h1>
      <p>管理頭像、姓名、Email、手機、系級與密碼。</p>
    </section>

    <section class="profile-grid">
      <aside class="panel profile-card">
        <span class="profile-avatar">{{ data.currentUser().avatar }}</span>
        <h2>{{ data.currentUser().name }}</h2>
        <p>{{ data.currentUser().role }} / {{ data.currentUser().status }}</p>
      </aside>

      <form class="form-card two-cols" (ngSubmit)="save()">
        <label>
          姓名
          <input name="name" [(ngModel)]="profile.name" />
        </label>
        <label>
          Email
          <input type="email" name="email" [(ngModel)]="profile.email" />
        </label>
        <label>
          手機
          <input name="phone" [(ngModel)]="profile.phone" />
        </label>
        <label>
          系級
          <input name="department" [(ngModel)]="profile.department" />
        </label>
        <label>
          新密碼
          <input type="password" name="password" [(ngModel)]="password" />
        </label>
        <label>
          確認密碼
          <input type="password" name="confirmPassword" [(ngModel)]="confirmPassword" />
        </label>
        <button class="btn primary full" type="submit">儲存</button>
        <p class="form-message full" *ngIf="message">{{ message }}</p>
      </form>
    </section>
  `,
})
export class ProfilePage {
  readonly data = inject(ClubDataService);

  profile = { ...this.data.currentUser() };
  password = '';
  confirmPassword = '';
  message = '';

  save(): void {
    this.data.currentUser.set({ ...this.data.currentUser(), ...this.profile });
    this.message = '個人資料已更新。密碼變更之後會串接 PUT /users/:id。';
  }
}

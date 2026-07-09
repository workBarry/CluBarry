import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading">
      <span class="eyebrow">Profile</span>
      <h1>個人中心</h1>
      <p>管理頭像、姓名、Email、手機、系級。</p>
    </section>

    <section class="profile-grid">
      <aside class="panel profile-card">
        <span class="profile-avatar">{{ auth.currentUser()?.avatar }}</span>
        <h2>{{ auth.currentUser()?.name }}</h2>
        <p>{{ auth.currentUser()?.role }}</p>
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
        <button class="btn primary full" type="submit">儲存</button>
        <p class="form-message full" *ngIf="message">{{ message }}</p>
      </form>
    </section>
  `,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private readonly firebase = inject(FirebaseService);

  profile = { name: '', email: '', phone: '', department: '' };
  message = '';

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.profile = { name: user.name, email: user.email, phone: '', department: '' };
    }
  }

  async save(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    await this.firebase.updateUser(user.id, this.profile);
    this.message = '個人資料已更新。';
  }
}

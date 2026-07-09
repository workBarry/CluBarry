import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-layout">
      <div>
        <span class="eyebrow">Member Login</span>
        <h1>社員登入</h1>
        <p class="muted">登入後可以報名活動、查看自己的報名紀錄、接收活動與審核通知。</p>
        <div class="mock-hint">
          <strong>測試帳號</strong>
          <span>barry@example.com / password (Member)</span>
          <span>amy@example.com / password (Officer)</span>
          <span>kevin@example.com / password (Admin)</span>
        </div>
      </div>

      <form class="form-card" (ngSubmit)="submit()">
        <label>
          Email
          <input type="email" name="email" [(ngModel)]="email" placeholder="barry@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" [(ngModel)]="password" placeholder="password" />
        </label>
        <label class="checkbox-row">
          <input type="checkbox" name="remember" [(ngModel)]="remember" />
          Remember Me
        </label>
        <button class="btn primary" type="submit">登入</button>
        <p class="form-message" *ngIf="auth.error()">{{ auth.error() }}</p>
        <a routerLink="/register">還沒有帳號？前往註冊</a>
      </form>
    </section>
  `,
  styles: [
    `
      .mock-hint {
        display: grid; gap: 0.25rem; margin-top: 1rem; padding: 0.75rem;
        border: 1px dashed #dbe3ef; border-radius: 0.65rem; background: #f5f7fb;
        font-size: 0.82rem; color: #65758b;
      }
      .mock-hint strong { color: #166534; }
    `,
  ],
})
export class LoginPage {
  readonly auth = inject(AuthService);
  email = 'barry@example.com';
  password = 'password';
  remember = true;

  submit(): void {
    this.auth.login(this.email, this.password);
  }
}

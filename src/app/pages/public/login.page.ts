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
      </div>

      <form class="form-card" (ngSubmit)="submit()">
        <label>
          Email
          <input type="email" name="email" [(ngModel)]="email" placeholder="barry@example.com" />
        </label>
        <label>
          Password
          <input [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="password" placeholder="password" />
        </label>
        <label class="checkbox-row">
          <input type="checkbox" [(ngModel)]="showPassword" name="showPw" />
          顯示密碼
        </label>
        <label class="checkbox-row">
          <input type="checkbox" name="remember" [(ngModel)]="remember" />
          Remember Me
        </label>
        <button class="btn primary" type="submit" [disabled]="auth.loading() || !email || !password">
          {{ auth.loading() ? '登入中...' : '登入' }}
        </button>
        <p class="form-message" *ngIf="auth.error()">{{ auth.error() }}</p>
        <p class="form-message success" *ngIf="auth.success()">{{ auth.success() }}</p>
        <a routerLink="/register">還沒有帳號？前往註冊</a>
      </form>
    </section>
  `,
  styles: [
    `
      .success { color: var(--primary); }
    `,
  ],
})
export class LoginPage {
  readonly auth = inject(AuthService);
  email = '';
  password = '';
  remember = false;
  showPassword = false;

  async submit(): Promise<void> {
    await this.auth.login(this.email, this.password);
  }
}

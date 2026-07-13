import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-layout">
      <div>
        <span class="eyebrow">Join Club</span>
        <h1>註冊社員</h1>
        <p class="muted">填寫基本資料後，後台管理員可在社員管理中完成審核與角色設定。</p>
      </div>

      <form class="form-card two-cols" (ngSubmit)="submit()">
        <label>
          姓名
          <input name="name" [(ngModel)]="form.name" autocomplete="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" [(ngModel)]="form.email" autocomplete="email" required />
        </label>
        <label>
          學號
          <input name="studentId" [(ngModel)]="form.studentId" autocomplete="off" required />
        </label>
        <label>
          系級
          <input name="department" [(ngModel)]="form.department" required />
        </label>
        <label>
          密碼
          <input
            type="password"
            name="password"
            [(ngModel)]="form.password"
            autocomplete="new-password"
            minlength="6"
            required
          />
        </label>
        <label>
          確認密碼
          <input
            type="password"
            name="confirmPassword"
            [(ngModel)]="form.confirmPassword"
            autocomplete="new-password"
            minlength="6"
            required
          />
        </label>
        <button class="btn primary full" type="submit" [disabled]="auth.loading() || !canSubmit">
          {{ auth.loading() ? '建立帳號中...' : form.password !== form.confirmPassword ? '密碼不一致' : '送出註冊' }}
        </button>
        <p class="form-message full" *ngIf="auth.error()">{{ auth.error() }}</p>
        <a class="full" routerLink="/login">已有帳號？前往登入</a>
      </form>
    </section>
  `,
})
export class RegisterPage {
  readonly auth = inject(AuthService);

  form = {
    name: '',
    email: '',
    studentId: '',
    department: '',
    password: '',
    confirmPassword: '',
  };

  get canSubmit(): boolean {
    return !!this.form.name.trim()
      && !!this.form.email.trim()
      && !!this.form.studentId.trim()
      && !!this.form.department.trim()
      && this.form.password.length >= 6
      && this.form.password === this.form.confirmPassword;
  }

  async submit(): Promise<void> {
    if (this.form.password !== this.form.confirmPassword) return;
    await this.auth.register(this.form.email.trim(), this.form.password, {
      name: this.form.name.trim(),
      studentId: this.form.studentId.trim(),
      department: this.form.department.trim(),
    });
  }
}

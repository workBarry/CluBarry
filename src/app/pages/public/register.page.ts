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
          <input name="name" [(ngModel)]="form.name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" [(ngModel)]="form.email" required />
        </label>
        <label>
          學號
          <input name="studentId" [(ngModel)]="form.studentId" required />
        </label>
        <label>
          系級
          <input name="department" [(ngModel)]="form.department" required />
        </label>
        <label>
          密碼
          <input type="password" name="password" [(ngModel)]="form.password" required />
        </label>
        <label>
          確認密碼
          <input type="password" name="confirmPassword" [(ngModel)]="form.confirmPassword" required />
        </label>
        <button class="btn primary full" type="submit" [disabled]="form.password !== form.confirmPassword || !form.name">
          {{ form.password !== form.confirmPassword ? '密碼不一致' : '送出註冊' }}
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

  submit(): void {
    if (this.form.password !== this.form.confirmPassword) return;
    this.auth.register(this.form.email, this.form.password, {
      name: this.form.name,
      studentId: this.form.studentId,
      department: this.form.department,
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
          <input name="name" [(ngModel)]="form.name" />
        </label>
        <label>
          Email
          <input type="email" name="email" [(ngModel)]="form.email" />
        </label>
        <label>
          學號
          <input name="studentId" [(ngModel)]="form.studentId" />
        </label>
        <label>
          系級
          <input name="department" [(ngModel)]="form.department" />
        </label>
        <label>
          密碼
          <input type="password" name="password" [(ngModel)]="form.password" />
        </label>
        <label>
          確認密碼
          <input type="password" name="confirmPassword" [(ngModel)]="form.confirmPassword" />
        </label>
        <button class="btn primary full" type="submit">送出註冊</button>
        <p class="form-message full" *ngIf="message">{{ message }}</p>
        <a class="full" routerLink="/login">已有帳號？前往登入</a>
      </form>
    </section>
  `,
})
export class RegisterPage {
  form = {
    name: '',
    email: '',
    studentId: '',
    department: '',
    password: '',
    confirmPassword: '',
  };
  message = '';

  submit(): void {
    this.message = '註冊資料已送出，後續會串接 POST /register 與後台審核流程。';
  }
}

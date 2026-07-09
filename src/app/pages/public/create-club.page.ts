import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClubDataService } from '../../services/club-data.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-create-club-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading">
      <span class="eyebrow">New Club</span>
      <h1>開立社團</h1>
      <p>提交後由平台審核，通過後即為「活躍社團」並可開始開設活動與場次。</p>
    </section>

    <section class="form-card">
      <form class="form-grid" (ngSubmit)="create()">
        <label class="wide">社團名稱<input name="name" [(ngModel)]="name" required /></label>
        <label>分類<input name="category" [(ngModel)]="category" /></label>
        <label>標籤（逗號分隔）<input name="tags" [(ngModel)]="tags" /></label>
        <label class="wide">簡介<textarea name="description" [(ngModel)]="description"></textarea></label>
        <p class="notice" *ngIf="message">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="back()">取消</button>
          <button class="btn primary" type="submit" [disabled]="!name.trim()">提交審核</button>
        </div>
      </form>
    </section>
  `,
})
export class CreateClubPage {
  readonly auth = inject(AuthService);
  private readonly data = inject(ClubDataService);
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  name = '';
  category = '';
  tags = '';
  description = '';
  message = '';

  async create(): Promise<void> {
    const uid = this.auth.currentUser()?.id ?? '0';
    const club = {
      id: '',
      name: this.name.trim(),
      logo: this.name.trim().charAt(0),
      cover: 'linear-gradient(135deg, #2563eb, #14b8a6)',
      description: this.description.trim(),
      category: this.category.trim(),
      tags: this.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: 'pending' as const,
      createdBy: uid,
      createdAt: new Date().toISOString(),
    };
    if (this.data.firebaseReady()) {
      try {
        await this.firebase.createClub(club);
        this.message = '已提交，等待平台審核。';
        this.router.navigate(['/my-clubs']);
        return;
      } catch (e) {
        this.message = '提交失敗，請稍後再試。';
        return;
      }
    }
    this.message = '已提交（離線模式），等待平台審核。';
    this.router.navigate(['/my-clubs']);
  }

  back(): void {
    this.router.navigate(['/']);
  }
}

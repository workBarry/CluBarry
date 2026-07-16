import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClubDataService } from '../../services/club-data.service';

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
          <button class="btn primary" type="submit" [disabled]="!name.trim() || loading">提交審核</button>
        </div>
      </form>
    </section>
  `,
})
export class CreateClubPage {
  readonly auth = inject(AuthService);
  private readonly clubData = inject(ClubDataService);
  private readonly router = inject(Router);

  name = '';
  category = '';
  tags = '';
  description = '';
  message = '';
  loading = false;

  async create(): Promise<void> {
    const uid = this.auth.currentUser()?.id;
    if (!uid) {
      this.message = '請先登入。';
      return;
    }

    this.loading = true;
    this.message = '';
    let clubRef: { id: string } | null = null;
    try {
      clubRef = await this.clubData.createClub({
        name: this.name.trim(),
        logo: this.name.trim().charAt(0),
        cover: 'linear-gradient(135deg, #2563eb, #14b8a6)',
        description: this.description.trim(),
        category: this.category.trim(),
        tags: this.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: 'pending',
        createdBy: uid,
        createdAt: new Date().toISOString(),
      });
      await this.clubData.createClubMember({
        clubId: clubRef.id,
        userId: uid,
        roleInClub: 'President',
        status: 'pending',
        joinedAt: new Date().toISOString(),
      });
      this.message = '已提交，等待平台審核。';
      this.router.navigate(['/my-clubs']);
    } catch (err: any) {
      console.error('建立社團失敗:', err);
      if (clubRef?.id) {
        try { await this.clubData.deleteClub(clubRef.id); } catch { /* ignore rollback error */ }
      }
      this.message = err?.message ?? '提交失敗，請稍後再試。';
    } finally {
      this.loading = false;
    }
  }

  back(): void {
    this.router.navigate(['/']);
  }
}

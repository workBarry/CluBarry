import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClubDataService } from '../../services/club-data.service';
import { Announcement } from '../../types/club.models';

@Component({
  selector: 'app-announcements-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-heading">
      <span class="eyebrow">Announcements</span>
      <h1>公告</h1>
      <p>支援公告列表、搜尋、分類與公告詳情。</p>
    </section>

    <section class="toolbar">
      <input type="search" [(ngModel)]="keyword" placeholder="搜尋公告標題或內容" />
      <select [(ngModel)]="category">
        <option>全部</option>
        <option *ngFor="let item of categories">{{ item }}</option>
      </select>
    </section>

    <section class="list-panel">
      <a class="announcement-row" *ngFor="let item of filteredAnnouncements" [routerLink]="['/announcements', item.id]">
        <span class="pin" *ngIf="item.isPinned">置頂</span>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.content }}</p>
        </div>
        <small>{{ item.category }} / {{ item.createdAt | date:'yyyy/MM/dd HH:mm' }}</small>
      </a>
    </section>
  `,
})
export class AnnouncementsPage {
  private readonly data = inject(ClubDataService);

  keyword = '';
  category = '全部';

  get categories(): string[] {
    return [...new Set(this.data.announcements().map((item: Announcement) => item.category))];
  }

  get filteredAnnouncements() {
    const keyword = this.keyword.trim().toLowerCase();
    return this.data.announcements().filter((item: Announcement) => {
      const matchKeyword = !keyword || `${item.title} ${item.content}`.toLowerCase().includes(keyword);
      const matchCategory = this.category === '全部' || item.category === this.category;
      return matchKeyword && matchCategory;
    });
  }
}

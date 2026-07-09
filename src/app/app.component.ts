import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ClubDataService } from './services/club-data.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly data = inject(ClubDataService);

  readonly navItems = [
    { label: '首頁', path: '/', exact: true },
    { label: '公告', path: '/announcements' },
    { label: '活動', path: '/events' },
    { label: '我的活動', path: '/my-events' },
    { label: '通知', path: '/notifications' },
    { label: '個人中心', path: '/profile' },
  ];

  ngOnInit(): void {
    this.data.syncFromFirebase();
  }
}

import { Routes } from '@angular/router';
import { memberGuard, loginGuard } from './services/auth.guard';
import { AnnouncementDetailPage } from './pages/public/announcement-detail.page';
import { AnnouncementsPage } from './pages/public/announcements.page';
import { EventDetailPage } from './pages/public/event-detail.page';
import { EventsPage } from './pages/public/events.page';
import { HomePage } from './pages/public/home.page';
import { LoginPage } from './pages/public/login.page';
import { RegisterPage } from './pages/public/register.page';
import { MyEventsPage } from './pages/member/my-events.page';
import { NotificationsPage } from './pages/member/notifications.page';
import { ProfilePage } from './pages/member/profile.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'ClubWeb - 首頁' },
  { path: 'login', component: LoginPage, title: 'ClubWeb - 登入', canActivate: [loginGuard] },
  { path: 'register', component: RegisterPage, title: 'ClubWeb - 註冊' },
  { path: 'announcements', component: AnnouncementsPage, title: 'ClubWeb - 公告' },
  { path: 'announcements/:id', component: AnnouncementDetailPage, title: 'ClubWeb - 公告詳情' },
  { path: 'events', component: EventsPage, title: 'ClubWeb - 活動' },
  { path: 'events/:id', component: EventDetailPage, title: 'ClubWeb - 活動詳情' },
  { path: 'my-events', component: MyEventsPage, title: 'ClubWeb - 我的活動', canActivate: [memberGuard] },
  { path: 'notifications', component: NotificationsPage, title: 'ClubWeb - 我的通知', canActivate: [memberGuard] },
  { path: 'profile', component: ProfilePage, title: 'ClubWeb - 個人中心', canActivate: [memberGuard] },
  { path: '**', redirectTo: '' },
];

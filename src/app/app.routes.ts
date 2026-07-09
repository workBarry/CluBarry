import { Routes } from '@angular/router';
import { memberGuard, loginGuard } from './services/auth.guard';
import { AnnouncementDetailPage } from './pages/public/announcement-detail.page';
import { AnnouncementsPage } from './pages/public/announcements.page';
import { ClubPage } from './pages/public/club.page';
import { CreateClubPage } from './pages/public/create-club.page';
import { EventDetailPage } from './pages/public/event-detail.page';
import { EventsPage } from './pages/public/events.page';
import { HomePage } from './pages/public/home.page';
import { LoginPage } from './pages/public/login.page';
import { RegisterPage } from './pages/public/register.page';
import { MyClubsPage } from './pages/member/my-clubs.page';
import { MySessionsPage } from './pages/member/my-sessions.page';
import { NotificationsPage } from './pages/member/notifications.page';
import { ProfilePage } from './pages/member/profile.page';
import { SessionDetailPage } from './pages/public/session-detail.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'ClubWeb - 首頁' },
  { path: 'login', component: LoginPage, title: 'ClubWeb - 登入', canActivate: [loginGuard] },
  { path: 'register', component: RegisterPage, title: 'ClubWeb - 註冊' },
  { path: 'announcements', component: AnnouncementsPage, title: 'ClubWeb - 公告' },
  { path: 'announcements/:id', component: AnnouncementDetailPage, title: 'ClubWeb - 公告詳情' },
  { path: 'events', component: EventsPage, title: 'ClubWeb - 活動' },
  { path: 'clubs/:cid', component: ClubPage, title: 'ClubWeb - 社團' },
  { path: 'clubs/:cid/events/:eid', component: EventDetailPage, title: 'ClubWeb - 活動詳情' },
  { path: 'clubs/:cid/events/:eid/sessions/:sid', component: SessionDetailPage, title: 'ClubWeb - 場次詳情' },
  { path: 'create-club', component: CreateClubPage, title: 'ClubWeb - 開立社團', canActivate: [memberGuard] },
  { path: 'my-clubs', component: MyClubsPage, title: 'ClubWeb - 我的社團', canActivate: [memberGuard] },
  { path: 'my-sessions', component: MySessionsPage, title: 'ClubWeb - 我的場次', canActivate: [memberGuard] },
  { path: 'notifications', component: NotificationsPage, title: 'ClubWeb - 我的通知', canActivate: [memberGuard] },
  { path: 'profile', component: ProfilePage, title: 'ClubWeb - 個人中心', canActivate: [memberGuard] },
  { path: '**', redirectTo: '' },
];

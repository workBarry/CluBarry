import { Injectable, inject, signal, effect } from '@angular/core';
import { Subscription, interval, switchMap, of, catchError, filter, take } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import {
  Announcement,
  Club,
  ClubEvent,
  ClubMember,
  ClubUser,
  Notification,
  Registration,
  Session,
} from '../types/club.models';

const POLL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class ClubDataService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private subscriptions?: Subscription;
  private memberSub?: Subscription;
  private notificationSub?: Subscription;
  private initialLoadDone = false;

  private readonly clubState = signal<Club[]>([]);
  private readonly clubMemberState = signal<ClubMember[]>([]);
  private readonly sessionState = signal<Session[]>([]);
  private readonly eventState = signal<ClubEvent[]>([]);
  private readonly announcementState = signal<Announcement[]>([]);
  private readonly registrationState = signal<Registration[]>([]);
  private readonly notificationState = signal<Notification[]>([]);

  readonly firebaseReady = signal(false);
  message = '';

  get currentUser(): ClubUser | null {
    const authUser = this.auth.currentUser();
    if (!authUser) return null;
    return {
      id: authUser.id,
      avatar: authUser.avatar,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      studentId: '',
      department: '',
      grade: '',
      phone: '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }

  get currentUserId(): string {
    return this.auth.currentUser()?.id ?? '';
  }

  constructor() {
    effect(() => {
      const userId = this.auth.currentUser()?.id;
      if (!userId) {
        this.clubMemberState.set([]);
        this.notificationState.set([]);
        this.memberSub?.unsubscribe();
        this.notificationSub?.unsubscribe();
        return;
      }
      this.memberSub?.unsubscribe();
      this.memberSub = interval(POLL_MS).pipe(
        switchMap(() => this.api.getMyMemberships(userId).pipe(catchError(() => of([] as ClubMember[])))),
      ).subscribe((items) => this.clubMemberState.set(items));
      this.loadMemberships(userId);
      this.notificationSub?.unsubscribe();
      this.notificationSub = interval(POLL_MS).pipe(
        switchMap(() => this.api.getNotifications(userId).pipe(catchError(() => of([] as Notification[])))),
      ).subscribe((items) => this.notificationState.set(items));
      this.loadNotifications(userId);
    });
  }

  startSync(): void {
    if (this.subscriptions && !this.subscriptions.closed) return;
    this.subscriptions = new Subscription();
    this.subscriptions.add(interval(POLL_MS).pipe(
      switchMap(() => this.api.getClubs().pipe(catchError(() => of([] as Club[])))),
    ).subscribe((items) => this.clubState.set(items)));
    this.subscriptions.add(interval(POLL_MS).pipe(
      switchMap(() => this.api.getSessions().pipe(catchError(() => of([] as Session[])))),
    ).subscribe((items) => this.sessionState.set(items)));
    this.subscriptions.add(interval(POLL_MS).pipe(
      switchMap(() => this.api.getEvents({ status: 'published' }).pipe(catchError(() => of([] as ClubEvent[])))),
    ).subscribe((items) => this.eventState.set(items)));
    this.subscriptions.add(interval(POLL_MS).pipe(
      switchMap(() => this.api.getAnnouncements({ status: 'published' }).pipe(catchError(() => of([] as Announcement[])))),
    ).subscribe((items) => this.announcementState.set(items)));
    this.subscriptions.add(interval(POLL_MS).pipe(
      switchMap(() => this.api.getRegistrations().pipe(catchError(() => of([] as Registration[])))),
    ).subscribe((items) => this.registrationState.set(items)));
    this.waitAndLoadInitial();
    this.firebaseReady.set(true);
  }

  private waitAndLoadInitial(): void {
    const check = interval(500).pipe(
      filter(() => this.auth.authResolved()),
      take(1),
    ).subscribe(() => {
      this.loadClubs();
      this.loadSessions();
      this.loadEvents();
      this.loadAnnouncements();
      this.loadRegistrations();
    });
    this.subscriptions?.add(check);
  }

  stopSync(): void {
    this.subscriptions?.unsubscribe();
    this.subscriptions = undefined;
    this.memberSub?.unsubscribe();
    this.notificationSub?.unsubscribe();
    this.clubState.set([]);
    this.clubMemberState.set([]);
    this.sessionState.set([]);
    this.eventState.set([]);
    this.announcementState.set([]);
    this.registrationState.set([]);
    this.notificationState.set([]);
  }

  private loadClubs(): void {
    this.api.getClubs().pipe(catchError(() => of([] as Club[])))
      .subscribe((items) => this.clubState.set(items));
  }

  private loadSessions(): void {
    this.api.getSessions().pipe(catchError(() => of([] as Session[])))
      .subscribe((items) => this.sessionState.set(items));
  }

  private loadEvents(): void {
    this.api.getEvents({ status: 'published' }).pipe(catchError(() => of([] as ClubEvent[])))
      .subscribe((items) => this.eventState.set(items));
  }

  private loadAnnouncements(): void {
    this.api.getAnnouncements({ status: 'published' }).pipe(catchError(() => of([] as Announcement[])))
      .subscribe((items) => this.announcementState.set(items));
  }

  private loadRegistrations(): void {
    this.api.getRegistrations().pipe(catchError(() => of([] as Registration[])))
      .subscribe((items) => this.registrationState.set(items));
  }

  private loadMemberships(userId: string): void {
    this.api.getMyMemberships(userId).pipe(catchError(() => of([] as ClubMember[])))
      .subscribe((items) => this.clubMemberState.set(items));
  }

  private loadNotifications(userId: string): void {
    this.api.getNotifications(userId).pipe(catchError(() => of([] as Notification[])))
      .subscribe((items) => this.notificationState.set(items));
  }

  // --- Clubs ---
  clubs(): Club[] {
    return [...this.clubState()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  clubById(id: string | null): Club | undefined {
    return this.clubState().find((c) => c.id === id);
  }

  myClubs(): Club[] {
    const myIds = new Set(
      this.clubMemberState()
        .filter((m) => m.userId === this.currentUserId && m.status === 'active')
        .map((m) => m.clubId),
    );
    return this.clubState().filter((c) => myIds.has(c.id) && c.status !== 'closed');
  }

  myRoleInClub(clubId: string): ClubMember['roleInClub'] | null {
    return this.clubMemberState().find(
      (m) => m.clubId === clubId && m.userId === this.currentUserId && m.status === 'active',
    )?.roleInClub ?? null;
  }

  isClubMember(clubId: string): boolean {
    return this.clubMemberState().some(
      (m) => m.clubId === clubId && m.userId === this.currentUserId && m.status === 'active',
    );
  }

  canManageClub(clubId: string): boolean {
    const role = this.myRoleInClub(clubId);
    return role === 'President';
  }

  clubMembersOf(clubId: string): ClubMember[] {
    return this.clubMemberState().filter((m) => m.clubId === clubId);
  }

  async updateClub(id: string, data: Partial<Club>): Promise<void> {
    await this.api.updateClub(id, data).toPromise();
    this.clubState.update((items) => items.map((c) => c.id === id ? { ...c, ...data } : c));
  }

  async closeClub(id: string): Promise<void> {
    await this.updateClub(id, { status: 'closed' });
  }

  async createClub(data: Omit<Club, 'id'>): Promise<{ id: string }> {
    const result = await this.api.createClub(data).toPromise();
    this.loadClubs();
    return result!;
  }

  async createClubMember(data: Omit<ClubMember, 'id'>): Promise<{ id: string }> {
    const result = await this.api.createMember(data).toPromise();
    this.loadMemberships(this.currentUserId);
    return result!;
  }

  async deleteClub(id: string): Promise<void> {
    await this.api.deleteClub(id).toPromise();
    this.clubState.update((items) => items.filter((c) => c.id !== id));
  }

  // --- Events ---
  eventsByClub(clubId: string): ClubEvent[] {
    return this.eventState()
      .filter((e) => e.clubId === clubId && e.status === 'published')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  events(): ClubEvent[] {
    return this.eventState()
      .filter((e) => e.status === 'published')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  eventById(id: string | null): ClubEvent | undefined {
    return this.eventState().find((e) => String(e.id) === String(id));
  }

  async createEvent(data: Omit<ClubEvent, 'id' | 'createdAt'>): Promise<{ id: string }> {
    const result = await this.api.createEvent(data).toPromise();
    this.loadEvents();
    return result!;
  }

  // --- Sessions ---
  sessionsByEvent(eventId: string): Session[] {
    return this.sessionState().filter((s) => s.eventId === eventId);
  }

  sessionById(id: string | null): Session | undefined {
    return this.sessionState().find((s) => String(s.id) === String(id));
  }

  canRegister(session: Session): boolean {
    return session.openToNonMember || this.isClubMember(session.clubId);
  }

  // --- Announcements ---
  announcements(): Announcement[] {
    return this.announcementState()
      .filter((a) => a.status === 'published')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  announcementsByClub(clubId: string): Announcement[] {
    return this.announcementState()
      .filter((a) => a.clubId === clubId && a.status === 'published')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  announcementById(id: string | null): Announcement | undefined {
    return this.announcementState().find((a) => String(a.id) === String(id));
  }

  async createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Promise<{ id: string }> {
    const result = await this.api.createAnnouncement(data).toPromise();
    this.loadAnnouncements();
    return result!;
  }

  async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
    await this.api.updateAnnouncement(id, data).toPromise();
    this.announcementState.update((items) => items.map((a) => a.id === id ? { ...a, ...data } : a));
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.api.deleteAnnouncement(id).toPromise();
    this.announcementState.update((items) => items.filter((a) => a.id !== id));
  }

  // --- Registrations ---
  registrationsForCurrentUser(): Registration[] {
    return this.registrationState();
  }

  isRegistered(sessionId: string): boolean {
    return this.registrationState().some(
      (r) => String(r.sessionId) === String(sessionId) && (r.status === 'registered' || r.status === 'pending'),
    );
  }

  pendingRegistrations(clubId: string): Registration[] {
    return this.registrationState().filter(
      (r) => r.clubId === clubId && r.status === 'pending',
    );
  }

  async register(session: Session): Promise<void> {
    if (this.isRegistered(session.id)) return;
    if (!this.canRegister(session)) {
      this.message = '此場次僅開放給社員參加。';
      return;
    }
    if (session.currentCount >= session.capacity) {
      this.message = '該場次已額滿。';
      return;
    }

    const event = this.eventById(session.eventId);
    if (event?.deadline && Date.now() > new Date(event.deadline).getTime()) {
      this.message = '報名已截止。';
      return;
    }

    const userId = this.currentUserId;
    const newRegistration: Registration = {
      id: Date.now().toString(),
      userId,
      clubId: session.clubId,
      eventId: session.eventId,
      sessionId: session.id,
      paymentStatus: 'unpaid',
      checkIn: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.registrationState.update((items) => [...items, newRegistration]);
    this.message = `已送出報名申請「${session.title}」，等待社長審核。`;

    try {
      const result = await this.api.createRegistration(newRegistration).toPromise();
      if (result) {
        this.registrationState.update((items) =>
          items.map((r) => r.id === newRegistration.id ? { ...r, id: result.id } : r),
        );
      }
    } catch (e) {
      console.error('Registration persist failed:', e);
      this.registrationState.update((items) => items.filter((r) => r.id !== newRegistration.id));
      this.message = '報名送出失敗，請稍後再試。';
    }
  }

  approveRegistration(registration: Registration): void {
    const session = this.sessionState().find((s) => s.id === registration.sessionId);
    if (session && session.currentCount >= session.capacity) {
      this.message = '該場次已額滿，無法通過審核。';
      return;
    }

    const approverName = this.auth.currentUser()?.name ?? '管理員';
    const now = new Date().toISOString();

    this.registrationState.update((items) =>
      items.map((r) => r.id === registration.id ? { ...r, status: 'registered' as const, approvedBy: approverName, approvedAt: now } : r),
    );
    if (session) {
      this.sessionState.update((items) =>
        items.map((s) => s.id === session.id ? { ...s, currentCount: s.currentCount + 1 } : s),
      );
    }

    this.message = '已通過報名審核。';
    this.api.updateRegistration(registration.id, { status: 'registered', approvedBy: approverName, approvedAt: now }).toPromise();
    this.api.createNotification({
      userId: registration.userId,
      title: '活動報名已通過',
      content: `你報名的活動已通過審核。`,
      type: 'review',
      isRead: false,
    }).toPromise();
  }

  rejectRegistration(registration: Registration): void {
    this.registrationState.update((items) =>
      items.map((r) => r.id === registration.id ? { ...r, status: 'cancelled' as const } : r),
    );

    this.message = '已拒絕報名申請。';
    this.api.updateRegistration(registration.id, { status: 'cancelled' }).toPromise();
    this.api.createNotification({
      userId: registration.userId,
      title: '活動報名未通過',
      content: `你報名的活動未通過審核，如有疑問請聯繫社團幹部。`,
      type: 'review',
      isRead: false,
    }).toPromise();
  }

  cancelRegistration(registrationId: string): void {
    this.registrationState.update((items) => {
      const reg = items.find((r) => String(r.id) === String(registrationId));
      if (!reg || reg.status !== 'registered') return items;
      this.sessionState.update((s) =>
        s.map((x) => (x.id === reg.sessionId ? { ...x, currentCount: Math.max(0, x.currentCount - 1) } : x)),
      );
      this.api.updateRegistration(registrationId, { status: 'cancelled' }).toPromise();
      return items.map((r) =>
        String(r.id) === String(registrationId) ? { ...r, status: 'cancelled' } : r,
      );
    });
  }

  // --- Notifications ---
  notificationsForCurrentUser(): Notification[] {
    return this.notificationState();
  }

  markNotificationRead(id: string): void {
    this.notificationState.update((items) => items.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    this.api.markNotificationRead(id).toPromise();
  }
}

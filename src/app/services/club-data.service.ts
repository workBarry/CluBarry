import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import {
  announcements, clubs, clubMembers, events, notifications, registrations, sessions, users,
} from '../data/mock-club-data';
import {
  Announcement, Club, ClubEvent, ClubMember, ClubUser, Notification, Registration, Session,
} from '../types/club.models';

@Injectable({ providedIn: 'root' })
export class ClubDataService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);

  async createClub(club: Omit<Club, 'id'>, userId: string): Promise<void> {
    const localId = `c_${Date.now()}`;
    const local: Club = { ...club, id: localId };
    const member: ClubMember = {
      id: `cm_${Date.now()}`,
      userId,
      clubId: localId,
      roleInClub: 'President',
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    this.clubState.update((items) => [local, ...items]);
    this.clubMemberState.update((items) => [member, ...items]);

    if (this.firebaseReady()) {
      try {
        const ref = await this.firebase.createClub(club);
        const id = (ref as { id: string }).id;
        this.clubState.update((items) => items.map((c) => (c.id === localId ? { ...c, id } : c)));
        await this.firebase.createClubMember({ ...member, clubId: id });
      } catch (e) {
        console.error('Firebase createClub failed:', e);
      }
    }
  }

  private readonly clubState = signal<Club[]>(clubs.map((c) => ({ ...c })));
  private readonly clubMemberState = signal<ClubMember[]>(clubMembers.map((m) => ({ ...m })));
  private readonly sessionState = signal<Session[]>(sessions.map((s) => ({ ...s })));
  private readonly eventState = signal<ClubEvent[]>(events.map((e) => ({ ...e })));
  private readonly announcementState = signal<Announcement[]>(announcements.map((a) => ({ ...a })));
  private readonly registrationState = signal<Registration[]>([]);
  private readonly notificationState = signal<Notification[]>([]);

  readonly firebaseReady = signal(false);
  message = '';

  get currentUser(): ClubUser {
    const authUser = this.auth.currentUser();
    if (!authUser) return { ...users[0] };
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
    return this.auth.currentUser()?.id ?? '0';
  }

  async syncFromFirebase(): Promise<void> {
    try {
      const [fbClubs, fbMembers, fbEvents, fbSessions, fbAnnouncements, fbRegistrations, fbNotifications] = await Promise.all([
        firstValueFrom(this.firebase.watchActiveClubs()),
        firstValueFrom(this.firebase.watchClubMembersByUser(this.currentUserId)),
        firstValueFrom(this.firebase.watchPublishedEvents()),
        firstValueFrom(this.firebase.watchSessions()),
        firstValueFrom(this.firebase.watchPublishedAnnouncements()),
        firstValueFrom(this.firebase.watchRegistrationsByUser(this.currentUserId)),
        firstValueFrom(this.firebase.watchNotifications(this.currentUserId)),
      ]);

      if (fbClubs?.length) this.clubState.set(fbClubs as Club[]);
      if (fbMembers?.length) this.clubMemberState.set(fbMembers as ClubMember[]);
      if (fbEvents?.length) this.eventState.set(fbEvents as ClubEvent[]);
      if (fbSessions?.length) this.sessionState.set(fbSessions as Session[]);
      if (fbAnnouncements?.length) this.announcementState.set(fbAnnouncements as Announcement[]);
      if (fbRegistrations) this.registrationState.set(fbRegistrations as Registration[]);
      if (fbNotifications) this.notificationState.set(fbNotifications as Notification[]);

      this.firebaseReady.set(true);
    } catch {
      console.warn('Firebase not configured, using mock data');
      this.firebaseReady.set(false);
    }
  }

  // --- Clubs ---
  clubs(): Club[] {
    return [...this.clubState()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  clubById(id: string | null): Club | undefined {
    return this.clubState().find((c) => c.id === id);
  }

  myClubs(): Club[] {
    const myIds = new Set(
      this.clubMemberState().filter((m) => m.userId === this.currentUserId && m.status === 'active').map((m) => m.clubId),
    );
    return this.clubState().filter((c) => myIds.has(c.id));
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

  clubMembersOf(clubId: string): ClubMember[] {
    return this.clubMemberState().filter((m) => m.clubId === clubId);
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
    return this.announcementState().filter((a) => a.clubId === clubId && a.status === 'published');
  }

  announcementById(id: string | null): Announcement | undefined {
    return this.announcementState().find((a) => String(a.id) === String(id));
  }

  // --- Registrations ---
  registrationsForCurrentUser(): Registration[] {
    return this.registrationState();
  }

  isRegistered(sessionId: string): boolean {
    return this.registrationState().some(
      (r) => String(r.sessionId) === String(sessionId) && r.status === 'registered',
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

    const userId = this.currentUserId;
    const newRegistration: Registration = {
      id: Date.now().toString(),
      userId,
      clubId: session.clubId,
      eventId: session.eventId,
      sessionId: session.id,
      paymentStatus: 'unpaid',
      checkIn: false,
      status: 'registered',
      createdAt: new Date().toISOString(),
    };

    this.registrationState.update((items) => [...items, newRegistration]);
    this.sessionState.update((items) =>
      items.map((s) => (s.id === session.id ? { ...s, currentCount: s.currentCount + 1 } : s)),
    );
    this.message = `你已報名「${session.title}」。`;

    if (this.firebaseReady()) {
      try {
        await this.firebase.createRegistration(newRegistration);
      } catch (e) {
        console.error('Firebase persist failed:', e);
      }
    }
  }

  cancelRegistration(registrationId: string): void {
    this.registrationState.update((items) => {
      const reg = items.find((r) => String(r.id) === String(registrationId));
      if (!reg || reg.status !== 'registered') return items;
      this.sessionState.update((s) =>
        s.map((x) => (x.id === reg.sessionId ? { ...x, currentCount: Math.max(0, x.currentCount - 1) } : x)),
      );
      if (this.firebaseReady()) {
        this.firebase.updateRegistration(registrationId, { status: 'cancelled' });
      }
      return items.map((r) => (String(r.id) === String(registrationId) ? { ...r, status: 'cancelled' } : r));
    });
  }

  // --- Notifications ---
  notificationsForCurrentUser(): Notification[] {
    return this.notificationState();
  }

  markNotificationRead(id: string): void {
    this.notificationState.update((items) => items.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (this.firebaseReady()) this.firebase.markNotificationRead(id);
  }
}

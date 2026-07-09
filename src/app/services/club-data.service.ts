import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { announcements, events, notifications, registrations, users } from '../data/mock-club-data';
import { Announcement, ClubEvent, ClubUser, Notification, Registration } from '../types/club.models';

@Injectable({ providedIn: 'root' })
export class ClubDataService {
  private readonly firebase = inject(FirebaseService);

  private readonly eventState = signal<ClubEvent[]>(events.map((e) => ({ ...e })));
  private readonly registrationState = signal<Registration[]>(registrations.map((r) => ({ ...r })));
  private readonly notificationState = signal<Notification[]>(notifications.map((n) => ({ ...n })));

  readonly currentUser = signal<ClubUser>({ ...users[0] });
  readonly firebaseReady = signal(false);

  async syncFromFirebase(): Promise<void> {
    try {
      const [fbEvents, fbAnnouncements] = await Promise.all([
        firstValueFrom(this.firebase.watchPublishedEvents()),
        firstValueFrom(this.firebase.watchPublishedAnnouncements()),
      ]);

      if (fbEvents?.length) this.eventState.set(fbEvents as ClubEvent[]);
      if (fbAnnouncements?.length) {
        // announcements are stored in a separate signal-like read-only access
      }

      this.firebaseReady.set(true);
    } catch {
      console.warn('Firebase not configured, using mock data');
      this.firebaseReady.set(false);
    }
  }

  users(): ClubUser[] {
    return users.map((user) => ({ ...user }));
  }

  events(): ClubEvent[] {
    return this.eventState();
  }

  eventById(id: number | string): ClubEvent | undefined {
    return this.eventState().find((event) => String(event.id) === String(id));
  }

  announcements(): Announcement[] {
    if (this.firebaseReady()) {
      return announcements.filter((a) => a.status === 'published');
    }
    return announcements.filter((announcement) => announcement.status === 'published');
  }

  announcementById(id: number | string): Announcement | undefined {
    return this.announcements().find((announcement) => String(announcement.id) === String(id));
  }

  registrationsForCurrentUser(): Registration[] {
    const userId = String(this.currentUser().id);
    return this.registrationState().filter((registration) => String(registration.userId) === userId);
  }

  notificationsForCurrentUser(): Notification[] {
    const userId = String(this.currentUser().id);
    return this.notificationState().filter((notification) => String(notification.userId) === userId);
  }

  isRegistered(eventId: number | string): boolean {
    return this.registrationsForCurrentUser().some(
      (registration) => String(registration.eventId) === String(eventId) && registration.status === 'registered',
    );
  }

  async register(eventId: number | string): Promise<void> {
    if (this.isRegistered(eventId)) return;

    const event = this.eventById(eventId);
    if (!event || event.currentCount >= event.capacity) return;

    const userId = this.currentUser().id;
    const newRegistration: Registration = {
      id: Date.now(),
      userId,
      eventId: Number(eventId),
      paymentStatus: 'unpaid',
      checkIn: false,
      status: 'registered',
      createdAt: new Date().toISOString(),
    };

    this.registrationState.update((items) => [...items, newRegistration]);
    this.eventState.update((items) =>
      items.map((item) => (String(item.id) === String(eventId) ? { ...item, currentCount: item.currentCount + 1 } : item)),
    );

    const newNotification: Notification = {
      id: Date.now() + 1,
      userId,
      title: '報名成功',
      content: `你已完成「${event.title}」報名。`,
      type: 'event',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notificationState.update((items) => [newNotification, ...items]);

    if (this.firebaseReady()) {
      try {
        await this.firebase.createRegistration(newRegistration);
        await this.firebase.createNotification(newNotification);
      } catch (e) {
        console.error('Firebase persist failed:', e);
      }
    }
  }

  cancelRegistration(registrationId: number | string): void {
    this.registrationState.update((items) => {
      const reg = items.find((r) => String(r.id) === String(registrationId));
      if (!reg || reg.status !== 'registered') return items;
      this.eventState.update((evts) =>
        evts.map((e) =>
          String(e.id) === String(reg.eventId) ? { ...e, currentCount: Math.max(0, e.currentCount - 1) } : e,
        ),
      );
      if (this.firebaseReady()) {
        this.firebase.updateRegistration(String(registrationId), { status: 'cancelled' });
      }
      return items.map((r) => (String(r.id) === String(registrationId) ? { ...r, status: 'cancelled' as const } : r));
    });
  }
}

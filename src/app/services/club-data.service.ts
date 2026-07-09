import { Injectable, signal } from '@angular/core';
import { announcements, events, notifications, registrations, users } from '../data/mock-club-data';
import { Announcement, ClubEvent, ClubUser, Notification, Registration } from '../types/club.models';

@Injectable({ providedIn: 'root' })
export class ClubDataService {
  private readonly eventState = signal<ClubEvent[]>(events.map((event) => ({ ...event })));
  private readonly registrationState = signal<Registration[]>(registrations.map((registration) => ({ ...registration })));
  private readonly notificationState = signal<Notification[]>(notifications.map((notification) => ({ ...notification })));

  readonly currentUser = signal<ClubUser>({ ...users[0] });

  users(): ClubUser[] {
    return users.map((user) => ({ ...user }));
  }

  events(): ClubEvent[] {
    return this.eventState();
  }

  eventById(id: number): ClubEvent | undefined {
    return this.eventState().find((event) => event.id === id);
  }

  announcements(): Announcement[] {
    return announcements.filter((announcement) => announcement.status === 'published');
  }

  announcementById(id: number): Announcement | undefined {
    return this.announcements().find((announcement) => announcement.id === id);
  }

  registrationsForCurrentUser(): Registration[] {
    const userId = this.currentUser().id;
    return this.registrationState().filter((registration) => registration.userId === userId);
  }

  notificationsForCurrentUser(): Notification[] {
    const userId = this.currentUser().id;
    return this.notificationState().filter((notification) => notification.userId === userId);
  }

  isRegistered(eventId: number): boolean {
    return this.registrationsForCurrentUser().some(
      (registration) => registration.eventId === eventId && registration.status === 'registered',
    );
  }

  register(eventId: number): void {
    if (this.isRegistered(eventId)) {
      return;
    }

    const event = this.eventById(eventId);
    if (!event || event.currentCount >= event.capacity) {
      return;
    }

    const userId = this.currentUser().id;
    this.registrationState.update((items) => [
      ...items,
      {
        id: Date.now(),
        userId,
        eventId,
        paymentStatus: 'unpaid',
        checkIn: false,
        status: 'registered',
        createdAt: new Date().toISOString(),
      },
    ]);

    this.eventState.update((items) =>
      items.map((item) => (item.id === eventId ? { ...item, currentCount: item.currentCount + 1 } : item)),
    );

    this.notificationState.update((items) => [
      {
        id: Date.now() + 1,
        userId,
        title: '報名成功',
        content: `你已完成「${event.title}」報名。`,
        type: 'event',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
  }

  cancelRegistration(registrationId: number): void {
    const registration = this.registrationState().find((item) => item.id === registrationId);
    if (!registration || registration.status !== 'registered') {
      return;
    }

    this.registrationState.update((items) =>
      items.map((item) => (item.id === registrationId ? { ...item, status: 'cancelled' } : item)),
    );

    this.eventState.update((items) =>
      items.map((event) =>
        event.id === registration.eventId ? { ...event, currentCount: Math.max(0, event.currentCount - 1) } : event,
      ),
    );
  }
}

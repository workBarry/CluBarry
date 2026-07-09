import { Injectable, signal } from '@angular/core';
import { Announcement, ClubEvent, ClubUser, Notification, Registration } from '../types/club.models';
import { announcements, events, notifications, registrations, users } from '../data/mock-club-data';

export interface ClubState {
  events: ClubEvent[];
  registrations: Registration[];
  notifications: Notification[];
  currentUser: ClubUser;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClubStore {
  readonly state = signal<ClubState>({
    events: events.map((e) => ({ ...e })),
    registrations: registrations.map((r) => ({ ...r })),
    notifications: notifications.map((n) => ({ ...n })),
    currentUser: { ...users[0] },
    loading: false,
  });

  setLoading(loading: boolean): void {
    this.state.update((s) => ({ ...s, loading }));
  }

  setCurrentUser(user: ClubUser): void {
    this.state.update((s) => ({ ...s, currentUser: user }));
  }

  register(eventId: number): void {
    this.state.update((s) => {
      const event = s.events.find((e) => e.id === eventId);
      if (!event || event.currentCount >= event.capacity) return s;
      const alreadyRegistered = s.registrations.some(
        (r) => r.userId === s.currentUser.id && r.eventId === eventId && r.status === 'registered',
      );
      if (alreadyRegistered) return s;
      return {
        ...s,
        events: s.events.map((e) =>
          e.id === eventId ? { ...e, currentCount: e.currentCount + 1 } : e,
        ),
        registrations: [
          ...s.registrations,
          {
            id: Date.now(),
            userId: s.currentUser.id,
            eventId,
            paymentStatus: 'unpaid' as const,
            checkIn: false,
            status: 'registered' as const,
            createdAt: new Date().toISOString(),
          },
        ],
        notifications: [
          {
            id: Date.now() + 1,
            userId: s.currentUser.id,
            title: '報名成功',
            content: `你已完成「${event.title}」報名。`,
            type: 'event' as const,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...s.notifications,
        ],
      };
    });
  }

  cancelRegistration(registrationId: number): void {
    this.state.update((s) => {
      const reg = s.registrations.find((r) => r.id === registrationId);
      if (!reg || reg.status !== 'registered') return s;
      return {
        ...s,
        registrations: s.registrations.map((r) =>
          r.id === registrationId ? { ...r, status: 'cancelled' as const } : r,
        ),
        events: s.events.map((e) =>
          e.id === reg.eventId ? { ...e, currentCount: Math.max(0, e.currentCount - 1) } : e,
        ),
      };
    });
  }
}

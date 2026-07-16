import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap, catchError, of } from 'rxjs';
import { FirebaseService } from './firebase.service';
import {
  Announcement, Club, ClubEvent, ClubMember, ClubUser,
  Notification, Registration, Session,
} from '../types/club.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly firebase = inject(FirebaseService);
  private readonly base = environment.apiBaseUrl;

  private authHeaders(): Observable<HttpHeaders> {
    return from(this.firebase.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return new Observable<HttpHeaders>((obs) => { obs.next(headers); obs.complete(); });
      }),
    );
  }

  private get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => {
        let httpParams = new HttpParams();
        if (params) Object.entries(params).forEach(([k, v]) => { httpParams = httpParams.set(k, v); });
        return this.http.get<T>(`${this.base}${path}`, { headers, params: httpParams }).pipe(
          catchError((err) => { console.error(`API GET ${path} failed:`, err); return of([] as unknown as T); }),
        );
      }),
    );
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<T>(`${this.base}${path}`, body, { headers })),
    );
  }

  private put<T>(path: string, body: unknown): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.put<T>(`${this.base}${path}`, body, { headers })),
    );
  }

  private del<T>(path: string): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.delete<T>(`${this.base}${path}`, { headers })),
    );
  }

  getClubs(): Observable<Club[]> { return this.get<Club[]>('/clubs'); }
  getClub(id: string): Observable<Club> { return this.get<Club>(`/clubs/${id}`); }
  createClub(data: Omit<Club, 'id'>): Observable<{ id: string }> { return this.post<{ id: string }>('/clubs', data); }
  updateClub(id: string, data: Partial<Club>): Observable<void> { return this.put<void>(`/clubs/${id}`, data); }
  deleteClub(id: string): Observable<void> { return this.del<void>(`/clubs/${id}`); }

  getClubMembers(clubId: string): Observable<ClubMember[]> { return this.get<ClubMember[]>(`/clubs/${clubId}/members`); }
  getMyMemberships(userId: string): Observable<ClubMember[]> { return this.get<ClubMember[]>('/members', { userId }); }
  createMember(data: Omit<ClubMember, 'id'>): Observable<{ id: string }> { return this.post<{ id: string }>('/members', data); }
  updateMember(id: string, data: Partial<ClubMember>): Observable<void> { return this.put<void>(`/members/${id}`, data); }
  deleteMember(id: string): Observable<void> { return this.del<void>(`/members/${id}`); }

  getEvents(params?: Record<string, string>): Observable<ClubEvent[]> { return this.get<ClubEvent[]>('/events', params); }
  getEvent(id: string): Observable<ClubEvent> { return this.get<ClubEvent>(`/events/${id}`); }
  createEvent(data: Omit<ClubEvent, 'id' | 'createdAt'>): Observable<{ id: string }> { return this.post<{ id: string }>('/events', data); }
  updateEvent(id: string, data: Partial<ClubEvent>): Observable<void> { return this.put<void>(`/events/${id}`, data); }

  getSessions(params?: Record<string, string>): Observable<Session[]> { return this.get<Session[]>('/sessions', params); }
  getSession(id: string): Observable<Session> { return this.get<Session>(`/sessions/${id}`); }
  createSession(data: Omit<Session, 'id'>): Observable<{ id: string }> { return this.post<{ id: string }>('/sessions', data); }
  updateSession(id: string, data: Partial<Session>): Observable<void> { return this.put<void>(`/sessions/${id}`, data); }

  getRegistrations(params?: Record<string, string>): Observable<Registration[]> { return this.get<Registration[]>('/registrations', params); }
  createRegistration(data: Omit<Registration, 'id'>): Observable<{ id: string }> { return this.post<{ id: string }>('/registrations', data); }
  updateRegistration(id: string, data: Partial<Registration>): Observable<void> { return this.put<void>(`/registrations/${id}`, data); }

  getAnnouncements(params?: Record<string, string>): Observable<Announcement[]> { return this.get<Announcement[]>('/announcements', params); }
  getAnnouncement(id: string): Observable<Announcement> { return this.get<Announcement>(`/announcements/${id}`); }
  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Observable<{ id: string }> { return this.post<{ id: string }>('/announcements', data); }
  updateAnnouncement(id: string, data: Partial<Announcement>): Observable<void> { return this.put<void>(`/announcements/${id}`, data); }
  deleteAnnouncement(id: string): Observable<void> { return this.del<void>(`/announcements/${id}`); }

  getNotifications(userId: string): Observable<Notification[]> { return this.get<Notification[]>('/notifications', { userId }); }
  createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Observable<{ id: string }> { return this.post<{ id: string }>('/notifications', data); }
  markNotificationRead(id: string): Observable<void> { return this.put<void>(`/notifications/${id}`, { isRead: true }); }

  getUser(id: string): Observable<ClubUser> { return this.get<ClubUser>(`/users/${id}`); }
  updateUser(id: string, data: Partial<ClubUser>): Observable<void> { return this.put<void>(`/users/${id}`, data); }
}

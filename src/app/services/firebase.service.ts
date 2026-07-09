import { Injectable, NgZone, signal } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  Firestore, getFirestore,
  collection, doc,
  addDoc, setDoc, deleteDoc,
  query, where, orderBy, Timestamp, onSnapshot, DocumentReference,
} from 'firebase/firestore';
import {
  Auth, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, User as FirebaseUser,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Announcement, Club, ClubEvent, ClubMember, ClubUser, Notification, Registration, Session } from '../types/club.models';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly firestore: Firestore;
  private readonly auth: Auth;
  private readonly zone: NgZone;
  readonly currentFirebaseUser = signal<FirebaseUser | null>(null);

  constructor(zone: NgZone) {
    this.zone = zone;
    this.app = initializeApp(environment.firebase);
    this.firestore = getFirestore(this.app);
    this.auth = getAuth(this.app);

    onAuthStateChanged(this.auth, (user) => {
      zone.run(() => this.currentFirebaseUser.set(user));
    });
  }

  private snapshotObservable<T>(ref: any): Observable<T[]> {
    return new Observable((observer) => {
      const unsub = onSnapshot(ref, (snap: any) => {
        this.zone.run(() => {
          const items: T[] = [];
          snap.forEach((d: any) => items.push({ id: d.id, ...d.data() } as T));
          observer.next(items);
        });
      }, (err: any) => this.zone.run(() => observer.error(err)));
      return { unsubscribe: unsub };
    });
  }

  private docObservable<T>(ref: any): Observable<T | undefined> {
    return new Observable((observer) => {
      const unsub = onSnapshot(ref, (snap: any) => {
        this.zone.run(() => {
          observer.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined);
        });
      }, (err: any) => this.zone.run(() => observer.error(err)));
      return { unsubscribe: unsub };
    });
  }

  // --- Auth ---
  login(email: string, password: string): Promise<FirebaseUser> {
    return signInWithEmailAndPassword(this.auth, email, password).then((cred) => cred.user);
  }

  register(email: string, password: string): Promise<FirebaseUser> {
    return createUserWithEmailAndPassword(this.auth, email, password).then((cred) => cred.user);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // --- Users ---
  watchUsers(): Observable<ClubUser[]> {
    return this.snapshotObservable<ClubUser>(collection(this.firestore, 'users'));
  }

  getUser(id: string): Observable<ClubUser | undefined> {
    return this.docObservable<ClubUser>(doc(this.firestore, `users/${id}`));
  }

  createUser(data: Omit<ClubUser, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'users'), { ...data, createdAt: Timestamp.now() });
  }

  setUser(id: string, data: Omit<ClubUser, 'id'>): Promise<void> {
    return setDoc(doc(this.firestore, `users/${id}`), { ...data, createdAt: Timestamp.now() });
  }

  updateUser(id: string, data: Partial<ClubUser>): Promise<void> {
    return setDoc(doc(this.firestore, `users/${id}`), data, { merge: true });
  }

  // --- Clubs ---
  watchActiveClubs(): Observable<Club[]> {
    const q = query(collection(this.firestore, 'clubs'), where('status', '==', 'active'));
    return this.snapshotObservable<Club>(q);
  }

  getClub(id: string): Observable<Club | undefined> {
    return this.docObservable<Club>(doc(this.firestore, `clubs/${id}`));
  }

  createClub(data: Omit<Club, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'clubs'), { ...data, createdAt: Timestamp.now() });
  }

  updateClub(id: string, data: Partial<Club>): Promise<void> {
    return setDoc(doc(this.firestore, `clubs/${id}`), data, { merge: true });
  }

  // --- Club Members ---
  watchClubMembers(clubId: string): Observable<ClubMember[]> {
    const q = query(collection(this.firestore, 'clubMembers'), where('clubId', '==', clubId));
    return this.snapshotObservable<ClubMember>(q);
  }

  watchClubMembersByUser(userId: string): Observable<ClubMember[]> {
    const q = query(collection(this.firestore, 'clubMembers'), where('userId', '==', userId));
    return this.snapshotObservable<ClubMember>(q);
  }

  createClubMember(data: Omit<ClubMember, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'clubMembers'), { ...data, joinedAt: Timestamp.now() });
  }

  updateClubMember(id: string, data: Partial<ClubMember>): Promise<void> {
    return setDoc(doc(this.firestore, `clubMembers/${id}`), data, { merge: true });
  }

  // --- Events ---
  watchPublishedEvents(): Observable<ClubEvent[]> {
    const q = query(
      collection(this.firestore, 'events'),
      where('status', '==', 'published'),
    );
    return this.snapshotObservable<ClubEvent>(q);
  }

  watchEventsByClub(clubId: string): Observable<ClubEvent[]> {
    const q = query(
      collection(this.firestore, 'events'),
      where('clubId', '==', clubId),
      where('status', '==', 'published'),
    );
    return this.snapshotObservable<ClubEvent>(q);
  }

  getEvent(id: string): Observable<ClubEvent | undefined> {
    return this.docObservable<ClubEvent>(doc(this.firestore, `events/${id}`));
  }

  // --- Sessions ---
  watchSessionsByEvent(eventId: string): Observable<Session[]> {
    const q = query(collection(this.firestore, 'sessions'), where('eventId', '==', eventId));
    return this.snapshotObservable<Session>(q);
  }

  getSession(id: string): Observable<Session | undefined> {
    return this.docObservable<Session>(doc(this.firestore, `sessions/${id}`));
  }

  watchSessions(): Observable<Session[]> {
    return this.snapshotObservable<Session>(collection(this.firestore, 'sessions'));
  }

  // --- Registrations ---
  watchRegistrationsByUser(userId: string): Observable<Registration[]> {
    const q = query(collection(this.firestore, 'registrations'), where('userId', '==', userId));
    return this.snapshotObservable<Registration>(q);
  }

  watchRegistrationsByEvent(eventId: string): Observable<Registration[]> {
    const q = query(collection(this.firestore, 'registrations'), where('eventId', '==', eventId));
    return this.snapshotObservable<Registration>(q);
  }

  watchRegistrationsBySession(sessionId: string): Observable<Registration[]> {
    const q = query(collection(this.firestore, 'registrations'), where('sessionId', '==', sessionId));
    return this.snapshotObservable<Registration>(q);
  }

  createRegistration(data: Omit<Registration, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'registrations'), { ...data, createdAt: Timestamp.now() });
  }

  updateRegistration(id: string, data: Partial<Registration>): Promise<void> {
    return setDoc(doc(this.firestore, `registrations/${id}`), data, { merge: true });
  }

  // --- Announcements ---
  watchPublishedAnnouncements(): Observable<Announcement[]> {
    const q = query(
      collection(this.firestore, 'announcements'),
      where('status', '==', 'published'),
    );
    return this.snapshotObservable<Announcement>(q);
  }

  watchAnnouncementsByClub(clubId: string): Observable<Announcement[]> {
    const q = query(
      collection(this.firestore, 'announcements'),
      where('clubId', '==', clubId),
      where('status', '==', 'published'),
    );
    return this.snapshotObservable<Announcement>(q);
  }

  getAnnouncement(id: string): Observable<Announcement | undefined> {
    return this.docObservable<Announcement>(doc(this.firestore, `announcements/${id}`));
  }

  // --- Notifications ---
  watchNotifications(userId: string): Observable<Notification[]> {
    const q = query(
      collection(this.firestore, 'notifications'),
      where('userId', '==', userId),
    );
    return this.snapshotObservable<Notification>(q);
  }

  createNotification(data: Omit<Notification, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'notifications'), { ...data, createdAt: Timestamp.now() });
  }

  markNotificationRead(id: string): Promise<void> {
    return setDoc(doc(this.firestore, `notifications/${id}`), { isRead: true }, { merge: true });
  }
}

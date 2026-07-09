import { Injectable, NgZone, signal } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  Firestore, getFirestore,
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, onSnapshot, DocumentReference,
} from 'firebase/firestore';
import {
  Auth, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, User as FirebaseUser,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Announcement, ClubEvent, ClubUser, Notification, Registration } from '../types/club.models';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly firestore: Firestore;
  private readonly auth: Auth;
  readonly currentFirebaseUser = signal<FirebaseUser | null>(null);

  constructor(zone: NgZone) {
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
        const items: T[] = [];
        snap.forEach((d: any) => items.push({ id: d.id, ...d.data() } as T));
        observer.next(items);
      }, (err: any) => observer.error(err));
      return { unsubscribe: unsub };
    });
  }

  private docObservable<T>(ref: any): Observable<T | undefined> {
    return new Observable((observer) => {
      const unsub = onSnapshot(ref, (snap: any) => {
        observer.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined);
      }, (err: any) => observer.error(err));
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

  updateUser(id: string, data: Partial<ClubUser>): Promise<void> {
    return updateDoc(doc(this.firestore, `users/${id}`), data);
  }

  // --- Events ---
  watchPublishedEvents(): Observable<ClubEvent[]> {
    const q = query(
      collection(this.firestore, 'events'),
      where('status', '==', 'published'),
      orderBy('startTime', 'asc'),
    );
    return this.snapshotObservable<ClubEvent>(q);
  }

  getEvent(id: string): Observable<ClubEvent | undefined> {
    return this.docObservable<ClubEvent>(doc(this.firestore, `events/${id}`));
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

  createRegistration(data: Omit<Registration, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'registrations'), { ...data, createdAt: Timestamp.now() });
  }

  updateRegistration(id: string, data: Partial<Registration>): Promise<void> {
    return updateDoc(doc(this.firestore, `registrations/${id}`), data);
  }

  // --- Announcements ---
  watchPublishedAnnouncements(): Observable<Announcement[]> {
    const q = query(
      collection(this.firestore, 'announcements'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
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
      orderBy('createdAt', 'desc'),
    );
    return this.snapshotObservable<Notification>(q);
  }

  createNotification(data: Omit<Notification, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'notifications'), { ...data, createdAt: Timestamp.now() });
  }

  markNotificationRead(id: string): Promise<void> {
    return updateDoc(doc(this.firestore, `notifications/${id}`), { isRead: true });
  }
}

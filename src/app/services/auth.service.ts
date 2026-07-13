import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { FirebaseService } from './firebase.service';
import { UserRole } from '../types/club.models';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  constructor() {
    const saved = localStorage.getItem('club_user');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch {
        localStorage.removeItem('club_user');
      }
    }

    effect((onCleanup) => {
      const fbUser = this.firebase.currentFirebaseUser();
      if (fbUser) {
        const sub = this.firebase.getUser(fbUser.uid).subscribe({
          next: (userData) => {
            if (userData) {
              const authUser: AuthUser = {
                id: fbUser.uid,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar ?? userData.name.slice(0, 2).toUpperCase(),
                role: userData.role,
              };
              this.currentUser.set(authUser);
              localStorage.setItem('club_user', JSON.stringify(authUser));
            } else {
              const fallback = this.firebaseFallback(fbUser.uid, fbUser.displayName, fbUser.email);
              this.currentUser.set(fallback);
              localStorage.setItem('club_user', JSON.stringify(fallback));
            }
          },
          error: () => {
            const fallback = this.firebaseFallback(fbUser.uid, fbUser.displayName, fbUser.email);
            this.currentUser.set(fallback);
            localStorage.setItem('club_user', JSON.stringify(fallback));
          },
        });
        onCleanup(() => sub.unsubscribe());
      } else {
        this.currentUser.set(null);
        localStorage.removeItem('club_user');
      }
    });

    effect(() => {
      if (this.currentUser() && this.router.url === '/login') {
        this.router.navigate(['/']);
      }
    });
  }

  get isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  async login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await this.firebase.login(email, password);
    } catch (error) {
      this.error.set(this.authErrorMessage(error, '登入失敗，請確認 Email 與密碼。'));
    } finally {
      this.loading.set(false);
    }
  }

  async register(
    email: string,
    password: string,
    profile: { name: string; studentId: string; department: string },
  ): Promise<boolean> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await this.firebase.register(email, password, {
        avatar: profile.name.slice(0, 2).toUpperCase(),
        name: profile.name,
        studentId: profile.studentId,
        department: profile.department,
        grade: '',
        phone: '',
        role: 'Member',
        status: 'pending',
      });
      await this.firebase.logout();
      this.currentUser.set(null);
      localStorage.removeItem('club_user');
      this.success.set('帳號建立完成，現在可以登入。');
      await this.router.navigate(['/login']);
      return true;
    } catch (error) {
      this.error.set(this.authErrorMessage(error, '帳號建立失敗，請稍後再試。'));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.firebase.logout();
    this.currentUser.set(null);
    localStorage.removeItem('club_user');
    await this.router.navigate(['/login']);
  }

  private firebaseFallback(id: string, displayName: string | null, firebaseEmail: string | null): AuthUser {
    const email = firebaseEmail ?? '';
    const name = displayName?.trim() || email.split('@')[0] || '未命名社員';
    return {
      id,
      name,
      email,
      avatar: name.slice(0, 2).toUpperCase(),
      role: 'Member',
    };
  }

  private authErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof FirebaseError)) return fallback;
    const messages: Record<string, string> = {
      'auth/email-already-in-use': '此 Email 已建立帳號。',
      'auth/invalid-email': 'Email 格式不正確。',
      'auth/weak-password': '密碼強度不足，請至少輸入 6 個字元。',
      'auth/invalid-credential': 'Email 或密碼錯誤。',
      'auth/network-request-failed': '網路連線失敗，請稍後再試。',
    };
    return messages[error.code] ?? fallback;
  }
}

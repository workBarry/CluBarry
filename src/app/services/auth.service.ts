import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
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
  readonly error = signal('');

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
              const fallback: AuthUser = {
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email!.split('@')[0],
                email: fbUser.email!,
                avatar: fbUser.email!.slice(0, 2).toUpperCase(),
                role: 'Member',
              };
              this.currentUser.set(fallback);
              localStorage.setItem('club_user', JSON.stringify(fallback));
            }
          },
          error: () => {
            const fallback: AuthUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email!.split('@')[0],
              email: fbUser.email!,
              avatar: fbUser.email!.slice(0, 2).toUpperCase(),
              role: 'Member',
            };
            this.currentUser.set(fallback);
            localStorage.setItem('club_user', JSON.stringify(fallback));
          },
        });
        onCleanup(() => sub.unsubscribe());
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
    this.error.set('');
    try {
      await this.firebase.login(email, password);
    } catch {
      this.error.set('Email 或密碼錯誤，或 Firebase 尚未設定');
    }
  }

  async register(email: string, password: string, profile: { name: string; studentId: string; department: string }): Promise<void> {
    this.error.set('');
    try {
      const fbUser = await this.firebase.register(email, password);
      await this.firebase.setUser(fbUser.uid, {
        avatar: profile.name.slice(0, 2).toUpperCase(),
        name: profile.name,
        studentId: profile.studentId,
        department: profile.department,
        grade: '',
        email,
        phone: '',
        role: 'Member' as const,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      });
      this.router.navigate(['/login']);
    } catch {
      this.error.set('註冊失敗，或 Firebase 尚未設定');
    }
  }

  async logout(): Promise<void> {
    await this.firebase.logout();
    this.currentUser.set(null);
    localStorage.removeItem('club_user');
    this.router.navigate(['/login']);
  }
}

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

    effect(() => {
      const fbUser = this.firebase.currentFirebaseUser();
      if (fbUser) {
        this.firebase.getUser(fbUser.uid).subscribe((userData) => {
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
          }
        });
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
      await this.firebase.createUser({
        avatar: profile.name.slice(0, 2).toUpperCase(),
        name: profile.name,
        studentId: profile.studentId,
        department: profile.department,
        grade: '',
        email,
        phone: '',
        password,
        role: 'Member' as const,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      });
      this.router.navigate(['/login']);
    } catch {
      this.error.set('註冊失敗，或 Firebase 尚未設定');
    }
  }

  logout(): void {
    this.firebase.logout();
    this.currentUser.set(null);
    localStorage.removeItem('club_user');
    this.router.navigate(['/login']);
  }
}

import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ClubUser, UserRole } from '../types/club.models';
import { ClubDataService } from './club-data.service';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly error = signal('');

  constructor(
    private readonly router: Router,
    private readonly data: ClubDataService,
  ) {
    const saved = localStorage.getItem('club_user');
    if (saved) {
      try {
        const user: AuthUser = JSON.parse(saved);
        this.currentUser.set(user);
        this.data.currentUser.set({ ...this.data.currentUser(), id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role as UserRole });
      } catch {
        localStorage.removeItem('club_user');
      }
    }
  }

  get isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  login(email: string, password: string): void {
    this.error.set('');
    const found = this.data.users().find((u) => u.email === email && u.password === password);
    if (found) {
      const user: AuthUser = { id: found.id, name: found.name, email: found.email, avatar: found.avatar, role: found.role };
      this.currentUser.set(user);
      this.data.currentUser.set(found);
      localStorage.setItem('club_user', JSON.stringify(user));
      this.router.navigate(['/']);
    } else {
      this.error.set('Email 或密碼錯誤');
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('club_user');
    this.router.navigate(['/login']);
  }
}

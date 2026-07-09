import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated) {
    router.navigate(['/']);
    return false;
  }
  return true;
};

export const memberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const firebase = inject(FirebaseService);
  const router = inject(Router);
  if (!auth.isAuthenticated || !firebase.currentFirebaseUser()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SessionService } from '../services/session.service';
import { map } from 'rxjs/operators';

/**
 * Guard for Enterprise portal routes (/dashboard, /api-keys, etc.).
 * Redirects unauthenticated users to /login page.
 */
export const enterpriseGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  // 1. Instant check via cached local session
  const cachedUser = sessionService.getUser();
  if (cachedUser) {
    const role = cachedUser.role?.toLowerCase() || '';
    if (!role.includes('enterprise')) {
      return router.createUrlTree(['/login']);
    }
    // Asynchronously verify backend session in background
    sessionService.checkAuthentication().subscribe(isValid => {
      if (!isValid) {
        router.navigate(['/login']);
      }
    });
    return true;
  }

  // 2. Fallback network check if no local session found
  return sessionService.checkAuthentication().pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return router.createUrlTree(['/login']);
      }
      const user = sessionService.getUser();
      const role = user?.role?.toLowerCase() || '';
      if (!role.includes('enterprise')) {
        return router.createUrlTree(['/login']);
      }
      return true;
    })
  );
};

/**
 * Guard for guest routes (login, OTP verification).
 * Redirects authenticated users to /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const cachedUser = sessionService.getUser();
  if (cachedUser) {
    return router.createUrlTree(['/dashboard']);
  }

  return sessionService.checkAuthentication().pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    })
  );
};

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserSession {
  email: string;
  name: string;
  role: string;
  initials: string;
  user_id?: string;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly STORAGE_KEY = 'poempay_enterprise_user_session';
  private userSubject: BehaviorSubject<UserSession | null>;
  public currentUser$: Observable<UserSession | null>;
  private isAuthChecked = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    const initialUser = this.getInitialUser();
    this.userSubject = new BehaviorSubject<UserSession | null>(initialUser);
    this.currentUser$ = this.userSubject.asObservable();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getInitialUser(): UserSession | null {
    if (!this.isBrowser()) return null;
    const data = localStorage.getItem(this.STORAGE_KEY);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  resolveImageUrl(url?: string | null): string {
    if (!url || typeof url !== 'string') return '';
    const clean = url.trim();
    if (!clean || clean === 'null' || clean === 'undefined' || clean === '/null' || clean === '/undefined' || clean.endsWith('/null') || clean.endsWith('/undefined')) {
      return '';
    }
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean;
    }
    const base = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';
    const path = clean.startsWith('/') ? clean : '/' + clean;
    return base + path;
  }

  saveUser(email: string, name: string, role?: string, user_id?: string, avatar_url?: string): void {
    if (!this.isBrowser()) return;
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'AD';
    const resolvedRole = role || 'Admin';
    const resolvedAvatar = this.resolveImageUrl(avatar_url);
    const userData: UserSession = { email, name, role: resolvedRole, initials, user_id, avatar_url: resolvedAvatar };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    this.userSubject.next(userData);
  }

  getUser(): UserSession | null {
    return this.userSubject.getValue();
  }

  clearUser(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.STORAGE_KEY);
    this.isAuthChecked = false;
    this.userSubject.next(null);
  }

  logout(): Observable<any> {
    if (!this.isBrowser()) return of(null);
    const user = this.getUser();
    const isEnterprise = user?.role?.toLowerCase().includes('enterprise');
    const baseUrl = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';
    const logoutUrl = isEnterprise
      ? `${baseUrl}/v1/enterprise/portal/logout`
      : `${baseUrl}/admin/auth/logout`;

    return this.http.post<any>(logoutUrl, {}, { withCredentials: true }).pipe(
      map(res => {
        this.clearUser();
        return res;
      }),
      catchError(() => {
        const fallbackUrl = isEnterprise
          ? `${baseUrl}/admin/auth/logout`
          : `${baseUrl}/v1/enterprise/portal/logout`;
        return this.http.post<any>(fallbackUrl, {}, { withCredentials: true }).pipe(
          map(res => {
            this.clearUser();
            return res;
          }),
          catchError(() => {
            this.clearUser();
            return of(null);
          })
        );
      })
    );
  }


  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  getMe(): Observable<UserSession | null> {
    if (!this.isBrowser()) return of(null);
    const baseUrl = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';
    return this.http.get<any>(`${baseUrl}/v1/enterprise/portal/profile`, {
      withCredentials: true
    }).pipe(
      map(res => {
        const ent = res?.enterprise || res;
        if (ent && (ent.email || ent.id)) {
          const name = ent.name || ent.email;
          const role = 'ENTERPRISE_OWNER';
          const avatarUrl = ent.user?.avatar_url || ent.avatar_url || ent.logo_url;
          this.saveUser(ent.email, name, role, ent.id, avatarUrl);
          return this.getUser();
        }
        this.clearUser();
        return null;
      }),
      catchError(() => {
        this.clearUser();
        return of(null);
      })
    );
  }

  checkAuthentication(): Observable<boolean> {
    return this.getMe().pipe(
      map(user => {
        this.isAuthChecked = true;
        return user !== null;
      })
    );
  }
}

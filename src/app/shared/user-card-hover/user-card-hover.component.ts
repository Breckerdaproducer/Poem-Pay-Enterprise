import { Component, Input, OnInit, inject, ChangeDetectorRef, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-user-card-hover',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-card-hover.component.html',
  styleUrls: ['./user-card-hover.component.css']
})
export class UserCardHoverComponent implements OnInit {
  @Input() user: any = null;
  @Input() userId?: string;
  @Input() merchantId?: string;
  @Input() role?: string;
  @Input() displayName?: string;
  @Input() textClass: string = 'font-bold text-xs hover:text-indigo-400 transition-colors cursor-pointer';

  isHovered: boolean = false;
  isLoadingDetails: boolean = false;
  fetchedProfile: any = null;
  popoverTop: number = 0;
  popoverLeft: number = 0;
  private hoverTimer: any = null;

  private http = inject(HttpClient);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (this.user && typeof this.user === 'object') {
      if (!this.userId) {
        this.userId = this.user.user_id || this.user.id || this.user.userId || this.user.initiated_by_user_id;
      }
      if (!this.merchantId) {
        this.merchantId = this.user.merchant_id || (this.user.merchant ? (this.user.merchant.merchant_id || this.user.merchant.id) : undefined);
      }
      if (!this.role) {
        this.role = this.user.rawRole || this.user.role || this.user.user_type;
      }
    }
  }

  get effectiveUserId(): string {
    return this.userId || (this.user?.user_id || this.user?.id || this.user?.userId || '');
  }

  get effectiveMerchantId(): string {
    return this.merchantId || this.user?.merchant_id || (this.user?.merchant?.merchant_id || '');
  }

  get isSystemOrAdminOrInvalidUuid(): boolean {
    const uid = (this.effectiveUserId || '').trim();
    if (!uid) return true;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(uid)) return true;

    const roleLower = (this.role || this.user?.rawRole || this.user?.role || '').toLowerCase();
    const nameLower = (this.computedDisplayName || '').toLowerCase();

    if (['admin', 'operations', 'compliance', 'system', 'system agent'].includes(roleLower)) return true;
    if (nameLower.includes('system') || nameLower.includes('admin agent') || uid.toUpperCase().includes('SYSTEM')) return true;

    return false;
  }

  get isMerchant(): boolean {
    const r = (this.role || this.user?.rawRole || this.user?.role || this.user?.user_type || '').toLowerCase();
    return r === 'merchant' || r === 'merchant_owner' || r === 'merchant_staff' || !!this.effectiveMerchantId;
  }

  get targetRoute(): string[] {
    const uid = this.effectiveUserId;
    const mid = this.effectiveMerchantId;
    if (this.isMerchant) {
      return ['/merchant', mid || uid || ''];
    }
    return ['/customer', uid || ''];
  }

  get computedDisplayName(): string {
    if (this.displayName && this.displayName.trim()) {
      return this.displayName;
    }
    if (this.user) {
      if (typeof this.user === 'string') return this.user;
      if (this.user.name) return this.user.name;
      const fn = this.user.first_name || '';
      const ln = this.user.last_name || '';
      const full = `${fn} ${ln}`.trim();
      if (full) return full;
      if (this.user.email) return this.user.email;
    }
    if (this.fetchedProfile) {
      const fn = this.fetchedProfile.first_name || '';
      const ln = this.fetchedProfile.last_name || '';
      const full = `${fn} ${ln}`.trim();
      if (full) return full;
    }
    return this.effectiveUserId ? `User (${this.effectiveUserId.slice(0, 8)})` : 'User Profile';
  }

  get initials(): string {
    const name = this.computedDisplayName;
    if (!name || name.startsWith('User (')) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  avatarFailed: boolean = false;

  get userAvatarUrl(): string | null {
    if (this.avatarFailed) return null;
    let url = this.fetchedProfile?.avatar_url || 
              this.user?.avatar_url || 
              this.user?.avatar || 
              this.user?.owner?.avatar_url || 
              this.user?.owner_user?.avatar_url || 
              this.user?.metadata?.avatar_url || 
              null;
    const resolved = this.sessionService.resolveImageUrl(url);
    return resolved || null;
  }

  onAvatarError(): void {
    this.avatarFailed = true;
    this.cdr.detectChanges();
  }

  get userEmail(): string {
    return this.fetchedProfile?.email || this.user?.email || this.user?.userAccount || 'N/A';
  }

  get userPhone(): string {
    return this.fetchedProfile?.phone_number || this.user?.phone_number || 'N/A';
  }

  get userStatus(): string {
    return (this.fetchedProfile?.status || this.user?.status || 'ACTIVE').toUpperCase();
  }

  onMouseEnter(event?: MouseEvent): void {
    if (this.isSystemOrAdminOrInvalidUuid) {
      return;
    }

    if (event && event.currentTarget && isPlatformBrowser(this.platformId)) {
      const el = event.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      let top = rect.top - 200;
      if (top < 10) {
        top = rect.bottom + 8;
      }
      let left = rect.left;
      if (left + 290 > window.innerWidth) {
        left = window.innerWidth - 300;
      }
      if (left < 10) left = 10;

      this.popoverTop = top;
      this.popoverLeft = left;
    }

    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      this.isHovered = true;
      this.fetchExtraDetailsIfNeeded();
      this.cdr.detectChanges();
    }, 150);
  }

  onMouseLeave(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      this.isHovered = false;
      this.cdr.detectChanges();
    }, 200);
  }

  fetchExtraDetailsIfNeeded(): void {
    if (this.isSystemOrAdminOrInvalidUuid || this.fetchedProfile || this.isLoadingDetails || !isPlatformBrowser(this.platformId)) return;
    const uid = this.effectiveUserId;
    if (!uid) return;

    this.isLoadingDetails = true;
    this.http.get<any>(`${environment.backendUrl}admin/users/${uid}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.isLoadingDetails = false;
        this.fetchedProfile = res?.user || res?.data || res;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  navigate(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.isSystemOrAdminOrInvalidUuid) {
      return;
    }
    this.isHovered = false;
    this.router.navigate(this.targetRoute);
  }
}

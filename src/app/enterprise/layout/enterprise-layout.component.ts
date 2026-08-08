import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../services/session.service';

import { EnterpriseService, Enterprise } from '../../services/enterprise.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-enterprise-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="dashboard-wrapper flex h-screen overflow-hidden font-sans transition-colors duration-500"
         [class.light-mode]="isLightMode">

      <!-- Mobile Overlay -->
      <div class="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden"
           [ngClass]="sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
           (click)="sidebarOpen = false"></div>

      <!-- Sidebar -->
      <aside class="sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r shadow-2xl transition-all duration-300 lg:static lg:shadow-none"
             [ngClass]="[
               sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
               (sidebarCollapsed && !sidebarOpen) ? 'w-20' : 'w-64'
             ]">

        <!-- Logo Section -->
        <div class="sidebar-logo flex flex-shrink-0 items-center gap-3 border-b px-5 sm:px-6 pb-5 pt-6">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 shrink-0">
            <img src="logo.jpeg" alt="PoemPay Logo" class="h-full w-full object-cover" (error)="logoFailed = true" *ngIf="!logoFailed">
            <i *ngIf="logoFailed" class="fa-solid fa-building-columns text-indigo-400 text-lg"></i>
          </div>
          <div class="flex flex-col overflow-hidden transition-all duration-300" [ngClass]="(sidebarCollapsed && !sidebarOpen) ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
            <span class="text-sm font-black tracking-tight leading-none text-white">POEM PAY</span>
            <span class="text-[10px] font-extrabold text-indigo-400 mt-1 uppercase tracking-widest">Enterprise Gateway</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 overflow-y-auto px-3 py-6 space-y-8 scrollbar-hide">
          <div>
            <p class="nav-label text-[10px] font-extrabold tracking-[0.2em] px-4 mb-4 uppercase transition-all duration-300"
               [ngClass]="(sidebarCollapsed && !sidebarOpen) ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'">
              ENTERPRISE PORTAL
            </p>
            <ul class="space-y-1">
              <li *ngFor="let item of menuItems">
                <div
                  class="nav-item group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200"
                  [routerLink]="item.route"
                  routerLinkActive="selected-nav active"
                  [routerLinkActiveOptions]="{ exact: false }"
                  [title]="item.label"
                  (click)="sidebarOpen = false">

                  <div class="flex items-center gap-3.5 flex-1">
                    <span class="flex items-center justify-center w-5 shrink-0 transition-transform group-hover:scale-110">
                      <i [class]="item.icon" class="text-lg"></i>
                    </span>
                    <span class="whitespace-nowrap transition-all duration-300"
                          [ngClass]="(sidebarCollapsed && !sidebarOpen) ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'">
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Logout Action in Nav -->
          <div class="mt-auto pt-8">
            <ul class="space-y-1">
              <li class="nav-item group flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:!text-red-400"
                  (click)="onLogout()">
                <span class="flex items-center justify-center w-5 shrink-0 transition-transform group-hover:scale-110">
                  <i class="fa-solid fa-right-from-bracket text-lg"></i>
                </span>
                <span class="whitespace-nowrap transition-all duration-300"
                      [ngClass]="(sidebarCollapsed && !sidebarOpen) ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'">
                  Sign Out
                </span>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Sidebar Status Footer -->
        <div class="sidebar-status px-3 py-4 border-t shrink-0">
          <div class="flex items-center gap-3 p-3 rounded-xl transition-all"
               style="background: rgba(255,255,255,0.03)">
            <div class="relative shrink-0">
              <span class="flex w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
            </div>
            <div class="flex flex-col overflow-hidden transition-all duration-300" [ngClass]="(sidebarCollapsed && !sidebarOpen) ? 'w-0' : 'w-auto'">
              <p class="status-title text-[11px] font-bold leading-none">Gateway Online</p>
              <p class="status-sub text-[10px] mt-1 whitespace-nowrap">99.98% SLA Uptime</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Body Container -->
      <main class="flex-1 flex flex-col overflow-hidden min-w-0">

        <!-- Top Bar Header -->
        <header class="flex items-center justify-between px-3 sm:px-8 py-3.5 border-b shrink-0 gap-2 sm:gap-4 transition-all duration-500"
                style="background: var(--topbar-bg); border-color: var(--border)">

          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <button class="p-2 rounded-xl transition-all lg:hidden shrink-0 cursor-pointer"
                    style="background: var(--bg-hover); color: var(--text-secondary)"
                    (click)="sidebarOpen = !sidebarOpen"
                    aria-label="Toggle navigation menu">
              <i class="fa-solid fa-bars-staggered"></i>
            </button>

            <!-- Mobile Logo -->
            <div class="flex lg:hidden items-center shrink-0">
              <div class="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-indigo-500/10">
                <img src="logo.jpeg" alt="PoemPay Logo" class="h-full w-full object-cover">
              </div>
            </div>

            <button class="collapse-btn-top p-2 rounded-xl transition-all hidden lg:flex shrink-0 cursor-pointer"
                    style="background: var(--bg-hover); color: var(--text-secondary)"
                    (click)="sidebarCollapsed = !sidebarCollapsed"
                    aria-label="Collapse sidebar">
              <i class="fa-solid" [ngClass]="sidebarCollapsed ? 'fa-indent' : 'fa-outdent'"></i>
            </button>
            <div class="h-6 w-px hidden lg:block" style="background: var(--border)"></div>

            <div class="min-w-0">
              <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 class="text-xs sm:text-base font-bold tracking-tight truncate max-w-[120px] xs:max-w-[200px] sm:max-w-none"
                    style="color: var(--text-primary)">
                  {{ profile?.name || 'Enterprise Portal' }}
                </h1>
                <span class="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0"
                      [ngClass]="profile?.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                  <span class="w-1.5 h-1.5 rounded-full animate-pulse" [ngClass]="profile?.environment === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                  {{ profile?.environment || 'LIVE' }} GATEWAY
                </span>
              </div>
              <p class="text-[10px] sm:text-xs mt-0.5 truncate" style="color: var(--text-muted)">
                B2B ID: <span class="font-mono font-bold text-indigo-400">{{ profile?.id?.substring(0,8) || 'N/A' }}...</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-4 shrink-0">

            <!-- 2FA Security Pill Button -->
            <button
              (click)="open2faSetupModal()"
              class="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs"
              [ngClass]="(profile?.mfa_enabled || profile?.is_2fa_enabled) ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'"
              [title]="(profile?.mfa_enabled || profile?.is_2fa_enabled) ? 'Google 2FA Active' : 'Setup Google 2FA Protection'"
            >
              <i class="fa-solid" [ngClass]="(profile?.mfa_enabled || profile?.is_2fa_enabled) ? 'fa-shield-halved text-emerald-600' : 'fa-triangle-exclamation text-amber-600 animate-pulse'"></i>
              <span class="hidden sm:inline">{{ (profile?.mfa_enabled || profile?.is_2fa_enabled) ? '2FA Active' : 'Enable 2FA' }}</span>
            </button>

            <a
              routerLink="/docs"
              class="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 sm:gap-2 bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white shadow-xs"
              title="API Documentation"
            >
              <i class="fa-solid fa-book-bookmark text-xs"></i>
              <span class="hidden md:inline">API Documentation</span>
            </a>

            <!-- User Profile Pill -->
            <div class="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-2 border-l" style="border-color: var(--border)">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-md shadow-indigo-500/20 shrink-0 relative overflow-hidden border border-indigo-300/30">
                <img *ngIf="getAvatarUrl() && !avatarFailed" [src]="getAvatarUrl()" (error)="avatarFailed = true" alt="Profile Avatar" class="w-full h-full object-cover">
                <span *ngIf="!getAvatarUrl() || avatarFailed">{{ getUserInitials() }}</span>
              </div>
              <div class="hidden sm:flex flex-col min-w-0">
                <p class="user-name-top text-sm font-bold leading-none truncate" style="color: var(--text-primary)">
                  {{ currentUser?.name || 'Enterprise Admin' }}
                </p>
                <p class="user-role-top text-[11px] font-bold mt-1 uppercase tracking-wider truncate" style="color: var(--text-muted)">
                  {{ currentUser?.email || 'admin@enterprise.com' }}
                </p>
              </div>
              <button
                (click)="onLogout()"
                title="Sign Out of Enterprise Portal"
                class="p-1.5 sm:p-2 rounded-xl transition-all text-slate-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center justify-center shrink-0">
                <i class="fa-solid fa-right-from-bracket text-sm"></i>
              </button>
            </div>

          </div>
        </header>

        <!-- Main Router Content Area -->
        <div class="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-10 transition-colors duration-500"
             style="background: var(--bg-base)">
          <div class="max-w-[1600px] mx-auto">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>

      <!-- Google Authenticator 2FA Security Setup Modal Popup -->
      <div *ngIf="show2faModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
        <div class="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white overflow-hidden">

          <!-- Glowing Security Glow Background -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Header Badge & Title -->
          <div class="text-center space-y-2 relative">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-1">
              <i class="fa-solid fa-shield-halved"></i> Security Requirement
            </div>
            <h2 class="text-xl font-bold tracking-tight">Enable Google Authenticator</h2>
            <p class="text-xs text-slate-300 leading-relaxed">
              Protect your Enterprise balance, API key creation, and payouts with 2-Factor Authentication (2FA).
            </p>
          </div>

          <!-- QR Code Container -->
          <div class="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-slate-950/60 relative">
            <div *ngIf="loading2faQr" class="py-8 flex flex-col items-center gap-3">
              <div class="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <span class="text-xs text-slate-400 font-semibold">Generating 2FA QR Code...</span>
            </div>

            <div *ngIf="!loading2faQr && qrCodeDataUrl" class="flex flex-col items-center space-y-3 w-full">
              <!-- QR Code Frame -->
              <div class="p-3 bg-white rounded-2xl shadow-lg border border-indigo-200">
                <img [src]="qrCodeDataUrl" alt="2FA QR Code" class="w-44 h-44 object-contain" />
              </div>
              
              <!-- Instructions -->
              <p class="text-[11px] text-center text-slate-300 font-medium max-w-xs">
                Scan this QR code using <span class="text-indigo-400 font-bold">Google Authenticator</span> or <span class="text-indigo-400 font-bold">Authy</span>.
              </p>

              <!-- Secret Key Copy Box -->
              <div *ngIf="secretKey" class="w-full flex items-center justify-between p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs font-mono">
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="text-[9px] uppercase font-bold text-slate-400">Secret Key</span>
                  <span class="text-indigo-300 font-bold truncate tracking-widest">{{ secretKey }}</span>
                </div>
                <button (click)="copy2faSecret()" type="button" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer shrink-0">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <!-- TOTP Code Form -->
          <form (submit)="onVerify2fa($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                Enter 6-Digit Authenticator Code
              </label>
              <input 
                type="text" 
                [(ngModel)]="totpCode" 
                name="totpCode" 
                maxLength="6" 
                placeholder="000 000" 
                autocomplete="off"
                class="w-full px-4 py-3 border border-slate-700 bg-slate-950 text-white rounded-xl text-lg text-center font-bold tracking-[0.5em] outline-none font-mono transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" 
              />
              <p *ngIf="totpError" class="text-xs text-red-400 text-center font-semibold mt-1.5">
                {{ totpError }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button 
                type="button" 
                (click)="dismiss2faModal()" 
                class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Remind Me Later
              </button>

              <button 
                type="submit" 
                [disabled]="totpCode.trim().length !== 6 || submitting2fa" 
                class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-lock text-xs" *ngIf="!submitting2fa"></i>
                <span *ngIf="!submitting2fa">Verify & Enable</span>
                <span *ngIf="submitting2fa">Verifying...</span>
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .sidebar {
      background: var(--sidebar-bg);
      border-right-color: rgba(99,130,255,0.12);
    }
    .sidebar-logo {
      border-bottom-color: rgba(255,255,255,0.06);
    }
    .sidebar-status {
      border-top-color: rgba(255,255,255,0.06);
    }
    .nav-label          { color: #3a567a; }
    .nav-item           { color: #4e6a94; }
    .nav-item:hover     { background: rgba(99,130,255,0.08); color: #8ba3cc; }
    .nav-item.active    { background: rgba(91,108,245,0.20); color: #a5b4fc; }
    .status-title       { color: #8ba3cc; }
    .status-sub         { color: #4e6a94; }
    .selected-nav {
      background: rgba(91,108,245,0.20) !important;
      color: #a5b4fc !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class EnterpriseLayoutComponent implements OnInit {
  isLightMode = true;
  sidebarOpen = false;
  sidebarCollapsed = false;

  profile: Enterprise | null = null;
  currentUser: any = null;
  logoFailed = false;
  avatarFailed = false;

  // 2FA Google Authenticator Modal State
  show2faModal = false;
  loading2faQr = false;
  qrCodeDataUrl: string | null = null;
  secretKey: string | null = null;
  totpCode = '';
  submitting2fa = false;
  totpError = '';
  mfaDismissed = false;

  menuItems = [
    { label: 'Overview & Telemetry', route: '/dashboard', icon: 'fa-solid fa-chart-pie' },
    { label: 'API Key Credentials', route: '/api-keys', icon: 'fa-solid fa-key' },
    { label: 'Real-Time Transactions', route: '/transactions', icon: 'fa-solid fa-receipt' },
    { label: 'Webhook Settings', route: '/webhooks', icon: 'fa-solid fa-network-wired' },
    { label: 'Profile & Settings', route: '/settings', icon: 'fa-solid fa-sliders' },
    { label: 'API Documentation', route: '/docs', icon: 'fa-solid fa-book-bookmark' },
  ];


  constructor(
    @Inject(DOCUMENT) private document: Document,
    private sessionService: SessionService,
    private enterpriseService: EnterpriseService,
    private loader: LoaderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUser = this.sessionService.getUser();
      this.sessionService.currentUser$.subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.avatarFailed = false;
          this.cdr.markForCheck();
        }
      });
      this.enterpriseService.enterprise$.subscribe(profile => {
        if (profile) {
          this.profile = profile;
          const is2faActive = profile.mfa_enabled || profile.is_2fa_enabled || (profile.user as any)?.mfa_enabled;
          if (!is2faActive && !this.mfaDismissed && !this.show2faModal) {
            this.open2faSetupModal();
          }
          this.cdr.markForCheck();
        }
      });
      this.enterpriseService.getPortalProfile().subscribe();
      this.updateTheme();
    }
  }

  open2faSetupModal(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.show2faModal = true;
    this.totpCode = '';
    this.totpError = '';
    if (!this.qrCodeDataUrl) {
      this.initiate2faSetup();
    }
  }

  initiate2faSetup(): void {
    this.loading2faQr = true;
    this.totpError = '';
    this.enterpriseService.generate2fa().subscribe({
      next: (res) => {
        this.loading2faQr = false;
        this.qrCodeDataUrl = res.qrCodeDataUrl;
        this.secretKey = res.secret;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading2faQr = false;
        this.totpError = err.error?.message || 'Could not generate 2FA QR code. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  onVerify2fa(event: Event): void {
    event.preventDefault();
    if (!this.totpCode || this.totpCode.trim().length !== 6) {
      this.totpError = 'Please enter a valid 6-digit Google Authenticator code';
      return;
    }
    this.submitting2fa = true;
    this.totpError = '';
    this.enterpriseService.enable2fa(this.totpCode.trim()).pipe(
      finalize(() => {
        this.submitting2fa = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.show2faModal = false;
        if (this.profile) {
          this.profile.mfa_enabled = true;
          this.profile.is_2fa_enabled = true;
        }
        alert('Google Authenticator (2FA) has been successfully enabled for your Enterprise account!');
      },
      error: (err) => {
        this.totpError = err.error?.message || 'Invalid 2FA code. Please double-check your Google Authenticator app.';
      }
    });
  }

  copy2faSecret(): void {
    if (this.secretKey && isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(this.secretKey);
      alert('Secret key copied to clipboard!');
    }
  }

  dismiss2faModal(): void {
    this.mfaDismissed = true;
    this.show2faModal = false;
  }

  toggleTheme(): void {
    this.isLightMode = !this.isLightMode;
    this.updateTheme();
  }

  private updateTheme(): void {
    if (this.isLightMode) {
      this.document.documentElement.classList.remove('dark');
    } else {
      this.document.documentElement.classList.add('dark');
    }
  }

  getAvatarUrl(): string {
    const raw = this.currentUser?.avatar_url || this.profile?.logo_url || this.profile?.avatar_url || (this.profile?.user as any)?.avatar_url;
    return this.sessionService.resolveImageUrl(raw);
  }

  getUserInitials(): string {
    const name = this.currentUser?.name || this.profile?.name || 'Enterprise Admin';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'EA';
  }

  onLogout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loader.show();
    this.sessionService.clearUser();
    this.sessionService.logout()
      .pipe(finalize(() => {
        this.loader.hide();
        this.router.navigate(['/login']);
      }))
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          this.router.navigate(['/login']);
        }
      });
  }
}


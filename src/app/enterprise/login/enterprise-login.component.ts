import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/session.service';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-enterprise-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex font-sans" [class.light-mode]="true" style="background: var(--bg-base)">

      <!-- LEFT PANEL (Desktop Branding & Security Info) -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style="background: linear-gradient(180deg, #111c35 0%, #0a1628 100%)">
        <!-- Abstract Background Decor -->
        <div class="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div class="absolute top-1/2 -left-24 w-64 h-64 bg-violet-600 rounded-full blur-3xl"></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
              <img src="logo.jpeg" alt="PoemPay Logo" class="h-full w-full object-cover">
            </div>
            <span class="text-xl font-bold text-white tracking-wider">POEM PAY</span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
              Enterprise
            </span>
          </div>
        </div>

        <div class="relative z-10 max-w-lg">
          <h1 class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Enterprise Payment <br />
            Gateway & Real-time <br />
            API Portal.
          </h1>

          <p class="text-lg leading-relaxed mb-8" style="color: #4e6a94">
            Integrate instant 120s payment prompts into your web application,
            monitor real-time transaction volume, and manage secret API keys
            from your dedicated enterprise portal.
          </p>

          <div class="border rounded-2xl p-6 backdrop-blur-sm" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06)">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-building-shield text-indigo-400 text-xl"></i>
              </div>
              <div>
                <h4 class="text-white font-bold mb-1">Dedicated B2B Infrastructure</h4>
                <p class="text-sm leading-relaxed" style="color: #4e6a94">
                  Authenticated via secret key signatures,
                  atomic wallet deductions, and real-time webhook callbacks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs" style="color: #3a567a">
          <span>© 2026 PoemPay Enterprise. All rights reserved.</span>
          <div class="flex gap-6">
            <a href="#" class="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-slate-300 transition-colors">Developer Docs</a>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL (Form Area) -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div class="w-full max-w-md">

          <!-- Mobile Logo -->
          <div class="lg:hidden mb-10 flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 mb-4">
              <img src="logo.jpeg" alt="PoemPay Logo" class="h-full w-full object-cover">
            </div>
            <span class="text-xl font-bold tracking-wider" style="color: var(--text-primary)">POEM PAY</span>
            <span class="text-xs font-semibold text-indigo-500 mt-1 uppercase tracking-widest">Enterprise Portal</span>
          </div>

          <div class="mb-10 text-center lg:text-left">
            <h2 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Enterprise Login</h2>
            <p style="color: var(--text-secondary)">
              Sign in with your enterprise credentials to access your portal
            </p>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-3">
            <i class="fa-solid fa-circle-exclamation text-lg flex-shrink-0"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <form (submit)="onLogin($event)" class="space-y-6">
            <div class="space-y-4">

              <!-- Enterprise Email Field -->
              <div class="space-y-2">
                <label for="email" class="block text-sm font-bold" style="color: var(--text-secondary)">Enterprise Email</label>
                <div class="relative group">
                  <i class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                  <input
                    id="email"
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    placeholder="contact@company.com"
                    required
                    class="w-full pl-11 pr-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    style="background: var(--bg-input); border-color: var(--border); color: var(--text-primary)"
                  />
                </div>
              </div>

              <!-- Security Password Field -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label for="password" class="block text-sm font-bold" style="color: var(--text-secondary)">Security Password</label>
                </div>
                <div class="relative group">
                  <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    placeholder="••••••••••••"
                    required
                    class="w-full pl-11 pr-12 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    style="background: var(--bg-input); border-color: var(--border); color: var(--text-primary)"
                  />
                  <button type="button" (click)="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <i class="fa-solid" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </div>

            </div>

            <!-- Trusted Session Option -->
            <div class="flex items-center">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"/>
                <span class="text-sm transition-colors" style="color: var(--text-secondary)">Remember session on this device</span>
              </label>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <span *ngIf="!isLoading">Authorize Enterprise Session</span>
              <span *ngIf="isLoading" class="flex items-center gap-2">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                Authenticating...
              </span>
            </button>
          </form>

          

        </div>
      </div>

    </div>
  `
})
export class EnterpriseLoginComponent implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private sessionService: SessionService,
    private loader: LoaderService,
    private notification: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {}

  onLogin(event?: Event): void {
    if (event) event.preventDefault();
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.email || !this.password) {
      this.errorMessage = 'Enterprise Email & Password are required';
      this.notification.error(this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.loader.show();
    this.cdr.detectChanges();

    const baseUrl = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';

    this.http.post<any>(`${baseUrl}/v1/enterprise/portal/login`, {
      email: this.email,
      password: this.password
    }, { withCredentials: true }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        if (res.otp_pending && res.temp_token) {
          this.notification.info('2FA OTP code sent to your email. Please verify.');
          this.router.navigate(['/otp'], { state: { token: res.temp_token, temp_token: res.temp_token } });
        } else {
          const user = res?.user || res;
          const role = (user?.role || '').toLowerCase();

          if (!role.includes('enterprise')) {
            this.errorMessage = 'Access Denied: This login is strictly for Enterprise accounts.';
            this.notification.error(this.errorMessage);
            this.sessionService.clearUser();
            return;
          }

          const name = user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : (user.name || user.email);

          this.sessionService.saveUser(user.email, name, user.role, user.user_id, user.avatar_url);
          this.notification.success('Enterprise login successful!');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid enterprise credentials. Please try again.';
        this.notification.error(this.errorMessage);
      }
    });
  }
}

import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/session.service';
import { NotificationService } from '../../services/notification.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-enterprise-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex font-sans" [class.light-mode]="true" style="background: var(--bg-base)">
      
      <!-- LEFT PANEL (Desktop Branding) -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style="background: linear-gradient(180deg, #111c35 0%, #0a1628 100%)">
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
              {{ isMfaStep ? 'Google 2FA' : 'Email OTP' }}
            </span>
          </div>
        </div>

        <div class="relative z-10 max-w-lg">
          <div *ngIf="isMfaStep" class="w-20 h-20 mb-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/15 shadow-xl">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Google_Authenticator_%28April_2023%29.svg/960px-Google_Authenticator_%28April_2023%29.svg.png?_=20230427070223" alt="Google Authenticator Logo" class="w-full h-full object-contain">
          </div>

          <h1 *ngIf="isMfaStep" class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Google <br />
            Authenticator <br />
            2FA Verification.
          </h1>

          <h1 *ngIf="!isMfaStep" class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Two-Factor <br />
            Email OTP <br />
            Verification.
          </h1>

          <p *ngIf="isMfaStep" class="text-lg leading-relaxed mb-8" style="color: #4e6a94">
            Open your Google Authenticator or Authy application to retrieve your active 6-digit TOTP security code.
          </p>

          <p *ngIf="!isMfaStep" class="text-lg leading-relaxed mb-8" style="color: #4e6a94">
            We have dispatched a 6-digit security verification code to your registered enterprise email address.
          </p>

          <div class="border rounded-2xl p-6 backdrop-blur-sm" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06)">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <img *ngIf="isMfaStep" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Google_Authenticator_%28April_2023%29.svg/960px-Google_Authenticator_%28April_2023%29.svg.png?_=20230427070223" alt="Google Authenticator" class="w-7 h-7 object-contain">
                <i *ngIf="!isMfaStep" class="fa-solid fa-envelope-circle-check text-indigo-400 text-xl"></i>
              </div>
              <div>
                <h4 class="text-white font-bold mb-1">{{ isMfaStep ? 'Google Authenticator Code' : 'Check Your Inbox' }}</h4>
                <p class="text-sm leading-relaxed" style="color: #4e6a94">
                  {{ isMfaStep ? 'Codes refresh every 30 seconds inside your authenticator app.' : 'The OTP is valid for 5 minutes. Check your spam folder if missing.' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs" style="color: #3a567a">
          <span>© 2026 PoemPay Enterprise. All rights reserved.</span>
        </div>
      </div>

      <!-- RIGHT PANEL (OTP / 2FA Input Form) -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div class="w-full max-w-md">
          
          <div class="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div *ngIf="isMfaStep" class="w-16 h-16 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Google_Authenticator_%28April_2023%29.svg/960px-Google_Authenticator_%28April_2023%29.svg.png?_=20230427070223" alt="Google Authenticator" class="w-full h-full object-contain">
            </div>

            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-extrabold uppercase tracking-wider mb-3">
              <i class="fa-solid" [ngClass]="isMfaStep ? 'fa-shield-halved' : 'fa-envelope'"></i>
              <span>{{ isMfaStep ? 'Step 1: Google Authenticator' : 'Step 2: Email Security OTP' }}</span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-bold mb-2" style="color: var(--text-primary)">
              {{ isMfaStep ? 'Google 2FA Verification' : 'Enterprise Email OTP' }}
            </h2>
            <p class="text-xs sm:text-sm" style="color: var(--text-secondary)">
              {{ isMfaStep ? 'Enter the 6-digit code generated in your Google Authenticator app' : 'Enter the 6-digit verification code sent to your email' }}
            </p>
          </div>

          <form (submit)="onVerify($event)" class="space-y-6">
            
            <!-- 6-digit OTP Box Inputs -->
            <div class="relative otp-wrapper my-6">
              <input
                type="text"
                inputmode="numeric"
                maxlength="6"
                [value]="otpValue"
                (input)="onInput($event)"
                class="otp-input-actual"
                autofocus
              />

              <div class="grid grid-cols-6 gap-1.5 sm:gap-3 h-full pointer-events-none">
                <div
                  *ngFor="let i of [0,1,2,3,4,5]"
                  class="otp-box flex items-center justify-center border-2 rounded-lg sm:rounded-xl text-lg sm:text-2xl font-black transition-all"
                  [class.active]="otpValue.length === i"
                  [class.filled]="otpValue.length > i"
                  style="background: var(--bg-input); border-color: var(--border); color: var(--text-primary)"
                >
                  {{ otpValue[i] || '' }}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <button
              type="submit"
              [disabled]="otpValue.length !== 6"
              class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              <span>{{ isMfaStep ? 'Verify Google 2FA Code' : 'Verify Email OTP & Access Portal' }}</span>
            </button>
          </form>

          <div class="mt-8 flex items-center justify-between text-xs gap-2" style="color: var(--text-muted)">
            <button (click)="goBack()" class="hover:text-indigo-500 transition-colors font-medium cursor-pointer">
              ← Back to Login
            </button>
            <button *ngIf="!isMfaStep" (click)="resendOtp()" class="text-indigo-500 hover:underline font-bold cursor-pointer">
              Resend OTP Email
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .otp-wrapper {
      width: 100%;
      height: 3.5rem;
    }
    @media (min-width: 640px) {
      .otp-wrapper {
        height: 4rem;
      }
    }
    .otp-input-actual {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 10;
      cursor: pointer;
      letter-spacing: 2em;
    }
    .otp-box.active {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
      transform: scale(1.05);
    }
    .otp-box.filled {
      border-color: rgba(99, 102, 241, 0.5) !important;
    }
  `]
})
export class EnterpriseOtpComponent implements OnInit {
  otpValue = '';
  tempToken: string | null = null;
  isMfaStep = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private sessionService: SessionService,
    private notification: NotificationService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const isBrowser = isPlatformBrowser(this.platformId);
    const stateObj = (isBrowser && typeof history !== 'undefined') ? history.state : null;
    this.tempToken = stateObj?.token || stateObj?.temp_token || this.route.snapshot.paramMap.get('token');
    this.isMfaStep = !!(stateObj?.mfa_pending || this.route.snapshot.queryParamMap.get('mfa'));
  }

  onInput(event: any): void {
    this.otpValue = event.target.value.replace(/[^0-9]/g, '').slice(0, 6);
  }

  onVerify(event: Event): void {
    event.preventDefault();
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.otpValue.length !== 6) {
      this.notification.error('Please enter a valid 6-digit code.');
      return;
    }

    this.loader.show();
    this.cdr.detectChanges();

    const baseUrl = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';

    if (this.isMfaStep) {
      // Step 1: Verify Google Authenticator 2FA TOTP code
      this.http.post<any>(`${baseUrl}/v1/enterprise/portal/verify-2fa`, {
        code: this.otpValue,
        temp_token: this.tempToken
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${this.tempToken}` }
      }).pipe(
        finalize(() => {
          this.loader.hide();
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (res) => {
          this.tempToken = res.temp_token;
          this.otpValue = '';
          this.isMfaStep = false;
          this.notification.success('Google 2FA code verified! OTP sent to your email.');
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Invalid 2FA code. Please check your Google Authenticator app.');
        }
      });
    } else {
      // Step 2: Verify Email OTP code
      this.http.post<any>(`${baseUrl}/v1/enterprise/portal/verify-otp`, {
        otp: this.otpValue,
        temp_token: this.tempToken
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${this.tempToken}` }
      }).pipe(
        finalize(() => {
          this.loader.hide();
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (res) => {
          const user = res.user;
          const name = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : (user.name || user.email);

          this.sessionService.saveUser(user.email, name, user.role, user.user_id, user.avatar_url);
          this.notification.success('Enterprise login successful!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Invalid or expired OTP code.');
        }
      });
    }
  }

  resendOtp(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loader.show();
    this.cdr.detectChanges();

    const baseUrl = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';

    this.http.post<any>(`${baseUrl}/v1/enterprise/portal/resend-otp`, {
      temp_token: this.tempToken
    }, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${this.tempToken}` }
    }).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.notification.success(res.message || 'New OTP sent to your email.');
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to resend OTP.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}

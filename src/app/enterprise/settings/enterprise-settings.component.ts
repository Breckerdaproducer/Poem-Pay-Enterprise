import { Component, OnInit, Inject, Optional, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, Enterprise } from '../../services/enterprise.service';
import { SessionService } from '../../services/session.service';
import { NotificationService } from '../../services/notification.service';
import { LoaderService } from '../../services/loader.service';
import { EnterpriseLayoutComponent } from '../layout/enterprise-layout.component';

@Component({
  selector: 'app-enterprise-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 text-slate-900 font-sans pb-12">
      
      <!-- Top Title Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div class="space-y-1">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h2 class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">Enterprise Settings & Security</h2>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              Admin Portal
            </span>
          </div>
          <p class="text-xs text-slate-500">Manage company identity details, contact information, and security credentials.</p>
        </div>

        <!-- Segmented Tab Switcher -->
        <div class="flex items-center gap-1 sm:gap-2 bg-slate-100/80 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 w-full md:w-auto">
          <button
            (click)="activeTab = 'profile'"
            [class.bg-white]="activeTab === 'profile'"
            [class.text-indigo-700]="activeTab === 'profile'"
            [class.shadow-xs]="activeTab === 'profile'"
            [class.text-slate-600]="activeTab !== 'profile'"
            class="flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-building-user text-xs"></i>
            <span>Profile & Identity</span>
          </button>

          <button
            (click)="activeTab = 'security'"
            [class.bg-white]="activeTab === 'security'"
            [class.text-indigo-700]="activeTab === 'security'"
            [class.shadow-xs]="activeTab === 'security'"
            [class.text-slate-600]="activeTab !== 'security'"
            class="flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-shield-halved text-xs"></i>
            <span>Security & 2FA OTP</span>
          </button>
        </div>
      </div>

      <!-- SECTION 1: PROFILE & COMPANY INFORMATION -->
      <div *ngIf="activeTab === 'profile'" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <div class="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <i class="fa-solid fa-id-card text-base"></i>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900">Company & Account Identity</h3>
              <p class="text-xs text-slate-500">Update registered enterprise name, primary notification email, and phone</p>
            </div>
          </div>

          <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border self-start sm:self-auto"
                [ngClass]="profile?.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
            {{ profile?.environment || 'LIVE' }} Gateway
          </span>
        </div>

        <form (ngSubmit)="onSaveProfile()" class="p-6 sm:p-8 space-y-6">
          
          <!-- Enterprise Profile Avatar / Logo Card -->
          <div class="p-6 rounded-3xl border border-slate-200/80 bg-slate-50/70 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div class="flex items-center gap-5">
                <!-- Avatar Preview Circle -->
                <div class="relative group shrink-0">
                  <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center font-black text-white text-xl sm:text-2xl shadow-lg shadow-indigo-500/25 overflow-hidden border-2 border-white ring-4 ring-indigo-50 font-sans">
                    <img *ngIf="getAvatarUrl() && !avatarFailed" [src]="getAvatarUrl()" (error)="avatarFailed = true" alt="Enterprise Avatar" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                    <span *ngIf="!getAvatarUrl() || avatarFailed">{{ getUserInitials() }}</span>
                  </div>

                  <!-- Uploading Overlay Spinner -->
                  <div *ngIf="uploadingAvatar" class="absolute inset-0 bg-slate-900/70 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-xs">
                    <i class="fa-solid fa-circle-notch animate-spin text-xl text-indigo-400"></i>
                    <span class="text-[9px] font-bold mt-1">Uploading...</span>
                  </div>
                </div>

                <div class="space-y-1">
                  <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">Profile Avatar & Company Logo</h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed max-w-md">
                    Upload your enterprise logo or profile picture to customize your portal interface and client payment links.
                  </p>
                  <div class="flex items-center gap-2 pt-1">
                    <span class="px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-[10px] font-bold uppercase">PNG, JPG, WEBP, GIF</span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-[10px] font-bold">Max 10MB</span>
                  </div>
                </div>
              </div>

              <!-- Avatar Actions -->
              <div class="flex items-center gap-2.5 self-start sm:self-center">
                <input
                  type="file"
                  #fileInput
                  (change)="onFileSelected($event)"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  class="hidden"
                />
                <button
                  type="button"
                  (click)="fileInput.click()"
                  [disabled]="uploadingAvatar"
                  class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer">
                  <i *ngIf="uploadingAvatar" class="fa-solid fa-circle-notch animate-spin text-xs"></i>
                  <i *ngIf="!uploadingAvatar" class="fa-solid fa-camera text-xs"></i>
                  <span>{{ getAvatarUrl() ? 'Change Avatar' : 'Upload Avatar' }}</span>
                </button>

                <button
                  *ngIf="getAvatarUrl()"
                  type="button"
                  (click)="onRemoveAvatar()"
                  [disabled]="uploadingAvatar"
                  class="px-3 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 disabled:opacity-50 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Remove avatar image">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                  <span class="hidden sm:inline">Remove</span>
                </button>
              </div>

            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Enterprise Name -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Enterprise / Organization Name <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-building text-xs"></i>
                </span>
                <input
                  type="text"
                  [(ngModel)]="profileForm.name"
                  name="enterpriseName"
                  required
                  placeholder="e.g. Acme Tech Global SARL"
                  class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <!-- Email Address -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Account Email <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-envelope text-xs"></i>
                </span>
                <input
                  type="email"
                  [(ngModel)]="profileForm.email"
                  name="enterpriseEmail"
                  required
                  placeholder="admin@enterprise.com"
                  class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <!-- Phone Number -->
            <div class="space-y-1.5 md:col-span-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Contact Phone Number
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-phone text-xs"></i>
                </span>
                <input
                  type="tel"
                  [(ngModel)]="profileForm.phone"
                  name="enterprisePhone"
                  placeholder="+237 6xx xxx xxx"
                  class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>
          </div>

          <!-- Enterprise Key Metadata Card -->
          <div class="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 text-xs space-y-2 text-indigo-950">
            <div class="flex items-center gap-2 font-extrabold text-indigo-900">
              <i class="fa-solid fa-circle-info text-indigo-600"></i>
              <span>System Account Reference Metadata</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
              <div>
                <span class="text-slate-500 font-medium">Enterprise ID:</span>
                <p class="font-mono font-bold text-slate-800 break-all">{{ profile?.id || 'N/A' }}</p>
              </div>
              <div>
                <span class="text-slate-500 font-medium">Account Status:</span>
                <p class="font-bold text-emerald-600">{{ profile?.status || 'ACTIVE' }}</p>
              </div>
              <div>
                <span class="text-slate-500 font-medium">Member Since:</span>
                <p class="font-semibold text-slate-800">{{ (profile?.created_at | date:'mediumDate') || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Form Submit Button -->
          <div class="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              [disabled]="savingProfile"
              class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer">
              <i *ngIf="savingProfile" class="fa-solid fa-circle-notch animate-spin text-xs"></i>
              <i *ngIf="!savingProfile" class="fa-solid fa-floppy-disk text-xs"></i>
              <span>{{ savingProfile ? 'Saving Changes...' : 'Save Profile Settings' }}</span>
            </button>
          </div>

        </form>
      </div>

      <!-- SECTION 2: SECURITY & PASSWORD CHANGE (WITH MANDATORY OTP) -->
      <div *ngIf="activeTab === 'security'" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <!-- Google Authenticator (2FA) Security Card -->
        <div class="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 p-2.5 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Google_Authenticator_%28April_2023%29.svg/960px-Google_Authenticator_%28April_2023%29.svg.png?_=20230427070223" alt="Google Authenticator" class="w-full h-full object-contain">
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-extrabold text-slate-900">Google Authenticator (2FA)</h4>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        [ngClass]="(profile?.mfa_enabled || profile?.is_2fa_enabled) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                    {{ (profile?.mfa_enabled || profile?.is_2fa_enabled) ? 'ENABLED & PROTECTED' : 'NOT ENABLED' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">Protect account access, API key creation, and automated payouts using Google Authenticator.</p>
              </div>
            </div>

            <!-- Action Buttons based on 2FA status -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- When 2FA IS Active -> Show Disable 2FA Button -->
              <button
                *ngIf="profile?.mfa_enabled || profile?.is_2fa_enabled"
                type="button"
                (click)="openDisable2faModal()"
                class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100">
                <i class="fa-solid fa-lock-open text-xs"></i>
                <span>Disable Google 2FA</span>
              </button>

              <!-- When 2FA is NOT Active -> Show Setup 2FA Button -->
              <button
                *ngIf="!profile?.mfa_enabled && !profile?.is_2fa_enabled"
                type="button"
                (click)="trigger2faSetupModal()"
                class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700">
                <i class="fa-solid fa-lock text-xs"></i>
                <span>Setup Google Authenticator (2FA)</span>
              </button>
            </div>
          </div>
        </div>

        <div class="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <i class="fa-solid fa-key text-base"></i>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900">Password Change with 2FA OTP Verification</h3>
            <p class="text-xs text-slate-500">Password updates require a 6-digit One-Time Password (OTP) dispatched to your registered email</p>
          </div>
        </div>

        <!-- Security Banner Box -->
        <div class="p-6 sm:p-8 space-y-6">
          
          <div class="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 text-xs text-amber-900 space-y-1.5">
            <div class="flex items-center gap-2 font-bold text-amber-950">
              <i class="fa-solid fa-shield-halved text-amber-600 text-sm"></i>
              Mandatory Security 2FA Requirement
            </div>
            <p class="text-amber-900 leading-relaxed font-medium">
              To protect your enterprise gateway credentials from unauthorized access, password modifications require live OTP authentication. 
              Click <strong>"Request OTP Code via Email"</strong> below to send a 6-digit code to <span class="font-bold underline">{{ profileForm.email }}</span>.
            </p>
          </div>

          <form (ngSubmit)="onChangePassword()" class="space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Current Password -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Current Password
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-lock text-xs"></i>
                  </span>
                  <input
                    [type]="showCurrentPass ? 'text' : 'password'"
                    [(ngModel)]="passwordForm.currentPassword"
                    name="currentPassword"
                    placeholder="Enter your current password"
                    class="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    (click)="showCurrentPass = !showCurrentPass"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i class="fa-solid text-xs" [ngClass]="showCurrentPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- New Password -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Password <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-key text-xs"></i>
                  </span>
                  <input
                    [type]="showNewPass ? 'text' : 'password'"
                    [(ngModel)]="passwordForm.newPassword"
                    name="newPassword"
                    required
                    minlength="6"
                    placeholder="At least 6 characters"
                    class="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    (click)="showNewPass = !showNewPass"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i class="fa-solid text-xs" [ngClass]="showNewPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- Confirm New Password -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm New Password <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-check-double text-xs"></i>
                  </span>
                  <input
                    [type]="showConfirmPass ? 'text' : 'password'"
                    [(ngModel)]="passwordForm.confirmPassword"
                    name="confirmPassword"
                    required
                    placeholder="Re-enter new password"
                    class="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    (click)="showConfirmPass = !showConfirmPass"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i class="fa-solid text-xs" [ngClass]="showConfirmPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- OTP Verification Code Field -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    6-Digit Security OTP Code <span class="text-red-500">*</span>
                  </label>
                  <span *ngIf="otpSent" class="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <i class="fa-solid fa-circle-check text-xs"></i>
                    OTP Sent to Email
                  </span>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <i class="fa-solid fa-shield-cat text-xs"></i>
                    </span>
                    <input
                      type="text"
                      [(ngModel)]="passwordForm.otp"
                      name="otpCode"
                      required
                      maxlength="6"
                      placeholder="123456"
                      class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs font-mono font-bold tracking-widest bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
                    />
                  </div>

                  <!-- Request / Resend OTP Button -->
                  <button
                    type="button"
                    (click)="onRequestOtp()"
                    [disabled]="sendingOtp || otpCooldown > 0"
                    class="px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer">
                    <i *ngIf="sendingOtp" class="fa-solid fa-circle-notch animate-spin text-xs"></i>
                    <i *ngIf="!sendingOtp" class="fa-solid fa-paper-plane text-xs"></i>
                    <span>
                      {{ otpCooldown > 0 ? ('Resend in ' + otpCooldown + 's') : (otpSent ? 'Resend OTP' : 'Request OTP Code') }}
                    </span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Password Mismatch Warning -->
            <div *ngIf="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
                 class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>New password and confirmation password do not match.</span>
            </div>

            <!-- Form Submit Button -->
            <div class="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                [disabled]="changingPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword || !passwordForm.otp || passwordForm.otp.length !== 6"
                class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                <i *ngIf="changingPassword" class="fa-solid fa-circle-notch animate-spin text-xs"></i>
                <i *ngIf="!changingPassword" class="fa-solid fa-shield-check text-xs"></i>
                <span>{{ changingPassword ? 'Updating Password...' : 'Verify OTP & Update Password' }}</span>
              </button>
            </div>

          </form>
        </div>

      </div>

      <!-- Disable 2FA Confirmation Modal -->
      <div *ngIf="showDisable2faModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <i class="fa-solid fa-triangle-exclamation text-base"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Disable Google 2FA</h3>
                <p class="text-xs text-slate-500">Confirm 2FA security deactivation</p>
              </div>
            </div>
            
            <button (click)="closeDisable2faModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="space-y-4">
            <p class="text-xs text-slate-600 leading-relaxed">
              Enter your current 6-digit code from your <strong class="text-slate-900">Google Authenticator</strong> app to confirm disabling 2-Factor Authentication.
            </p>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                [(ngModel)]="disable2faCode"
                maxlength="6"
                placeholder="000 000"
                class="w-full px-4 py-3 border border-slate-300 rounded-2xl text-lg font-mono font-extrabold tracking-[0.5em] text-center text-slate-900 bg-slate-50 focus:border-rose-500 focus:bg-white focus:outline-none shadow-xs"
              />
              <p *ngIf="disable2faError" class="text-xs font-bold text-rose-600 text-center mt-1.5">
                {{ disable2faError }}
              </p>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button 
                type="button"
                (click)="closeDisable2faModal()" 
                class="w-1/2 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              
              <button 
                type="button"
                (click)="confirmDisable2fa()" 
                [disabled]="disabling2fa || !disable2faCode || disable2faCode.trim().length !== 6"
                class="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                <i *ngIf="!disabling2fa" class="fa-solid fa-lock-open text-xs"></i>
                <i *ngIf="disabling2fa" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                <span>{{ disabling2fa ? 'Disabling...' : 'Confirm & Disable' }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `
})
export class EnterpriseSettingsComponent implements OnInit {
  activeTab: 'profile' | 'security' = 'profile';

  profile: Enterprise | null = null;
  currentUser: any = null;

  profileForm = {
    name: '',
    email: '',
    phone: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  };

  savingProfile = false;
  uploadingAvatar = false;
  avatarFailed = false;
  sendingOtp = false;
  changingPassword = false;

  otpSent = false;
  otpCooldown = 0;
  cooldownInterval: any = null;

  showCurrentPass = false;
  showNewPass = false;
  showConfirmPass = false;

  constructor(
    private enterpriseService: EnterpriseService,
    private sessionService: SessionService,
    private notification: NotificationService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(EnterpriseLayoutComponent) private layout?: EnterpriseLayoutComponent,
    @Inject(PLATFORM_ID) private platformId: Object = {}
  ) {}

  // Disable 2FA Modal State
  showDisable2faModal = false;
  disable2faCode = '';
  disabling2fa = false;
  disable2faError = '';

  trigger2faSetupModal(): void {
    if (this.layout) {
      this.layout.open2faSetupModal();
    }
  }

  openDisable2faModal(): void {
    this.showDisable2faModal = true;
    this.disable2faCode = '';
    this.disable2faError = '';
  }

  closeDisable2faModal(): void {
    this.showDisable2faModal = false;
    this.disable2faCode = '';
    this.disable2faError = '';
  }

  confirmDisable2fa(): void {
    if (!this.disable2faCode || this.disable2faCode.trim().length !== 6) {
      this.disable2faError = 'Please enter a valid 6-digit Google Authenticator code';
      return;
    }
    this.disabling2fa = true;
    this.disable2faError = '';

    this.enterpriseService.disable2fa(this.disable2faCode.trim()).pipe(
      finalize(() => {
        this.disabling2fa = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.showDisable2faModal = false;
        if (this.profile) {
          this.profile.mfa_enabled = false;
          this.profile.is_2fa_enabled = false;
        }
        this.notification.success('Google Authenticator (2FA) has been successfully disabled.');
        this.enterpriseService.getPortalProfile().subscribe();
      },
      error: (err) => {
        this.disable2faError = err.error?.message || 'Invalid 2FA code. Could not disable Google Authenticator.';
      }
    });
  }

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
      this.enterpriseService.enterprise$.subscribe(data => {
        if (data) {
          this.profile = data;
          this.profileForm.name = data.name || '';
          this.profileForm.email = data.email || this.currentUser?.email || '';
          this.profileForm.phone = data.phone || '';
          this.cdr.markForCheck();
        }
      });
      this.loadProfile();
    }
  }

  getAvatarUrl(): string {
    const raw = this.currentUser?.avatar_url || this.profile?.logo_url || this.profile?.avatar_url || (this.profile?.user as any)?.avatar_url;
    return this.sessionService.resolveImageUrl(raw);
  }

  getUserInitials(): string {
    const name = this.profileForm.name || this.currentUser?.name || this.profile?.name || 'Enterprise Admin';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'EA';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      this.notification.showError('File size exceeds 10MB limit. Please select a smaller image.');
      return;
    }

    this.uploadingAvatar = true;
    this.loader.show();

    this.enterpriseService.uploadAvatar(file)
      .pipe(finalize(() => {
        this.uploadingAvatar = false;
        this.loader.hide();
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.avatarFailed = false;
          const newUrl = res?.avatar_url || res?.logo_url;
          if (newUrl) {
            if (this.profile) {
              this.profile.logo_url = newUrl;
              this.profile.avatar_url = newUrl;
            }
            this.sessionService.saveUser(
              this.currentUser?.email || this.profileForm.email,
              this.currentUser?.name || this.profileForm.name,
              this.currentUser?.role,
              this.currentUser?.user_id,
              newUrl
            );
          }
          this.notification.showSuccess(res?.message || 'Profile avatar uploaded successfully!');
          input.value = '';
        },
        error: (err) => {
          console.error('Failed to upload avatar:', err);
          this.notification.showError(err?.error?.message || 'Failed to upload profile avatar.');
          input.value = '';
        }
      });
  }

  onRemoveAvatar(): void {
    this.uploadingAvatar = true;
    this.loader.show();

    this.enterpriseService.updatePortalProfile({
      logo_url: '',
      avatar_url: ''
    })
    .pipe(finalize(() => {
      this.uploadingAvatar = false;
      this.loader.hide();
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (res) => {
        this.avatarFailed = false;
        if (this.profile) {
          this.profile.logo_url = '';
          this.profile.avatar_url = '';
        }
        this.sessionService.saveUser(
          this.currentUser?.email || this.profileForm.email,
          this.currentUser?.name || this.profileForm.name,
          this.currentUser?.role,
          this.currentUser?.user_id,
          ''
        );
        this.notification.showSuccess('Profile avatar removed successfully.');
      },
      error: (err) => {
        console.error('Failed to remove avatar:', err);
        this.notification.showError(err?.error?.message || 'Failed to remove profile avatar.');
      }
    });
  }

  loadProfile(): void {
    this.loader.show();
    this.enterpriseService.getPortalProfile()
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (data) => {
          this.profile = data;
          this.profileForm.name = data.name || '';
          this.profileForm.email = data.email || this.currentUser?.email || '';
          this.profileForm.phone = data.phone || '';
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load profile:', err);
          this.notification.showError(err?.error?.message || 'Could not load enterprise profile.');
        }
      });
  }

  onSaveProfile(): void {
    if (!this.profileForm.name || !this.profileForm.email) {
      this.notification.showError('Enterprise name and email address are required.');
      return;
    }

    this.savingProfile = true;
    this.loader.show();

    this.enterpriseService.updatePortalProfile({
      name: this.profileForm.name,
      email: this.profileForm.email,
      phone: this.profileForm.phone
    })
    .pipe(finalize(() => {
      this.savingProfile = false;
      this.loader.hide();
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (res) => {
        this.notification.showSuccess(res?.message || 'Enterprise profile updated successfully!');
        if (res?.enterprise) {
          this.profile = res.enterprise;
        } else {
          if (this.profile) {
            this.profile.name = this.profileForm.name;
            this.profile.email = this.profileForm.email;
            this.profile.phone = this.profileForm.phone;
          }
        }
        if (this.currentUser) {
          this.sessionService.saveUser(
            this.profileForm.email,
            this.profileForm.name,
            this.currentUser.role,
            this.currentUser.user_id,
            this.currentUser.avatar_url
          );
        }
      },
      error: (err) => {
        console.error('Failed to update enterprise profile:', err);
        this.notification.showError(err?.error?.message || 'Failed to update enterprise profile.');
      }
    });
  }

  onRequestOtp(): void {
    this.sendingOtp = true;
    this.loader.show();

    this.enterpriseService.requestPasswordOtp()
      .pipe(finalize(() => {
        this.sendingOtp = false;
        this.loader.hide();
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.otpSent = true;
          this.notification.showSuccess(res?.message || 'OTP verification code sent to your email!');
          this.startCooldown(60);
        },
        error: (err) => {
          console.error('Failed to send password OTP:', err);
          this.notification.showError(err?.error?.message || 'Failed to send OTP code. Please try again.');
        }
      });
  }

  startCooldown(seconds: number): void {
    this.otpCooldown = seconds;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);

    this.cooldownInterval = setInterval(() => {
      this.otpCooldown--;
      if (this.otpCooldown <= 0) {
        clearInterval(this.cooldownInterval);
        this.otpCooldown = 0;
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  onChangePassword(): void {
    if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
      this.notification.showError('New password must be at least 6 characters long.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.notification.showError('New password and confirmation password do not match.');
      return;
    }
    if (!this.passwordForm.otp || this.passwordForm.otp.trim().length !== 6) {
      this.notification.showError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    this.changingPassword = true;
    this.loader.show();

    this.enterpriseService.changePasswordWithOtp({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword,
      otp: this.passwordForm.otp.trim()
    })
    .pipe(finalize(() => {
      this.changingPassword = false;
      this.loader.hide();
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (res) => {
        this.notification.showSuccess(res?.message || 'Password updated successfully!');
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          otp: ''
        };
        this.otpSent = false;
      },
      error: (err) => {
        console.error('Failed to change password:', err);
        this.notification.showError(err?.error?.message || 'Invalid OTP code or password change failed.');
      }
    });
  }
}

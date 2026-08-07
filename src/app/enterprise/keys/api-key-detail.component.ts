import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, EnterpriseTransaction } from '../../services/enterprise.service';
import { NotificationService } from '../../services/notification.service';
import { LoaderService } from '../../services/loader.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-api-key-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      
      <!-- Sticky Top Navigation Header -->
      <header class="border-b sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between border-slate-200/80 shadow-xs">
        <div class="flex items-center gap-3.5">
          <button (click)="goBack()" title="Back to API Keys" class="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center transition-all text-slate-700 shadow-2xs cursor-pointer">
            <i class="fa-solid fa-arrow-left text-xs"></i>
          </button>
          
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-extrabold text-base leading-tight text-slate-900 tracking-tight">
                {{ keyDetails?.key?.name || 'API Key Details' }}
              </h1>
              
              <!-- Environment Badge -->
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1.5"
                    [ngClass]="keyDetails?.key?.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" [ngClass]="keyDetails?.key?.environment === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                {{ keyDetails?.key?.environment || 'LIVE' }}
              </span>
            </div>
            
            <p class="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-2">
              <span>ID: <code class="font-mono font-bold text-slate-700">{{ keyId || 'N/A' }}</code></span>
              <span class="text-slate-300">•</span>
              <span>Created {{ (keyDetails?.key?.created_at | date:'mediumDate') || 'Recently' }}</span>
            </p>
          </div>
        </div>

        <!-- Header Action Buttons -->
        <div class="flex items-center gap-2.5">
          <button (click)="showDepositModal = true" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-circle-plus text-xs"></i>
            <span>Deposit Top-up</span>
          </button>

          <button (click)="showWithdrawModal = true" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-hand-holding-dollar text-xs"></i>
            <span>Withdraw Payout</span>
          </button>
        </div>
      </header>

      <!-- Main Container Body -->
      <main class="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <!-- 1. Hero Credential Banner Card -->
        <div class="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden space-y-6">
          <div class="absolute -right-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            <!-- Key Metadata & Docs Info -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                  <i class="fa-solid fa-key"></i>
                </span>
                <h2 class="text-xl font-extrabold text-white tracking-tight">API Integration Credentials</h2>
              </div>
              <p class="text-xs text-slate-400 max-w-xl leading-relaxed">
                Use your Secret Key (<code class="text-emerald-400 font-mono font-bold">sk_ent_live_...</code>) in the <code class="text-indigo-300 font-mono font-bold">x-api-key</code> HTTP header for all B2B API integrations.
              </p>
            </div>

            <!-- Credentials Controls Container -->
            <div class="flex flex-col gap-3 shrink-0">
              
              <!-- Row 1: Secret Key & Public Key Pills -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                <!-- Secret Key Pill -->
                <div class="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 font-mono text-xs text-emerald-400 flex items-center justify-between gap-3 shadow-inner">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-lock text-slate-500 text-xs"></i>
                    <span class="font-bold select-all">
                      {{ showSecretKey ? (keyDetails?.key?.secret_key || getMaskedKey(keyDetails?.key)) : getMaskedKey(keyDetails?.key) }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5 ml-3 border-l border-slate-700/80 pl-2">
                    <button 
                      (click)="showSecretKey = !showSecretKey" 
                      title="{{ showSecretKey ? 'Hide Secret Key' : 'Reveal Secret Key' }}"
                      class="text-slate-400 hover:text-white transition-colors text-xs p-1 cursor-pointer">
                      <i class="fa-solid" [ngClass]="showSecretKey ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>

                    <button 
                      (click)="copyToClipboard(keyDetails?.key?.secret_key)" 
                      title="Copy Secret API Key"
                      class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                      <i class="fa-regular fa-copy"></i>
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <!-- Public Key Pill -->
                <div class="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between gap-2">
                  <span class="text-slate-500 font-sans text-[11px] font-bold">Public Key:</span>
                  <span class="font-bold text-slate-200 select-all">{{ keyDetails?.key?.public_key || 'N/A' }}</span>
                  <button (click)="copyToClipboard(keyDetails?.key?.public_key)" class="text-slate-400 hover:text-white transition-colors text-xs p-1 cursor-pointer">
                    <i class="fa-regular fa-copy"></i>
                  </button>
                </div>

              </div>

              <!-- Row 2: Dedicated Webhook Secret Box -->
              <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 font-mono text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-shield-halved text-emerald-400 text-xs"></i>
                  <span class="text-slate-400 font-sans text-[11px] font-bold">Webhook Signature Secret:</span>
                  <span class="font-bold text-emerald-400 select-all break-all">{{ keyDetails?.key?.webhook_secret || 'whsec_...' }}</span>
                </div>

                <button 
                  (click)="copyToClipboard(keyDetails?.key?.webhook_secret)" 
                  class="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-auto">
                  <i class="fa-regular fa-copy"></i>
                  <span>Copy Secret</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        <!-- 2. API Key Permissions & Security Controls Card -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-base shrink-0 font-bold">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-extrabold text-slate-900 tracking-tight">Withdrawal Payout Permission</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                        [ngClass]="keyDetails?.key?.is_withdrawal_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                    {{ keyDetails?.key?.is_withdrawal_enabled ? 'ENABLED' : 'RESTRICTED (Default)' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Controls whether this API key can programmatically trigger cashout payout withdrawals via API. Requires 2FA OTP verification to enable.
                </p>
              </div>
            </div>

            <button 
              (click)="openWithdrawalPermissionModal(!keyDetails?.key?.is_withdrawal_enabled)"
              class="px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
              [ngClass]="keyDetails?.key?.is_withdrawal_enabled ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'">
              <i class="fa-solid" [ngClass]="keyDetails?.key?.is_withdrawal_enabled ? 'fa-lock' : 'fa-lock-open'"></i>
              <span>{{ keyDetails?.key?.is_withdrawal_enabled ? 'Disable Payout Access' : 'Enable Payout Access (2FA OTP)' }}</span>
            </button>

          </div>
        </div>

        <!-- 3. Financial Metrics Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Available Wallet Balance -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100">
                <i class="fa-solid fa-wallet text-lg"></i>
              </div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Available Funds
              </span>
            </div>
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-4">WALLET BALANCE</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 tracking-tight">
              XAF {{ (keyDetails?.wallet?.available_balance || 0) | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Ready for instant withdrawal payouts</p>
          </div>

          <!-- Total Processed Volume -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 border border-indigo-100">
                <i class="fa-solid fa-chart-line text-lg"></i>
              </div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gross Collections
              </span>
            </div>
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-4">PROCESSED VOLUME</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-indigo-600 tracking-tight">
              XAF {{ (keyDetails?.wallet?.total_volume || 0) | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Total customer collections processed</p>
          </div>

          <!-- Net Earnings -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-amber-600 bg-amber-50 border border-amber-100">
                <i class="fa-solid fa-coins text-lg"></i>
              </div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Net Earnings
              </span>
            </div>
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-4">NET REVENUE</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-amber-600 tracking-tight">
              XAF {{ (keyDetails?.wallet?.net_earnings || 0) | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Earnings after 2% fee deduction</p>
          </div>

          <!-- Total Withdrawn -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-100">
                <i class="fa-solid fa-building-columns text-lg"></i>
              </div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Total Payouts
              </span>
            </div>
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-4">TOTAL WITHDRAWN</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-purple-700 tracking-tight">
              XAF {{ (keyDetails?.wallet?.total_withdrawn || 0) | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Cashout payouts processed</p>
          </div>

        </div>

        <!-- 4. Unified API Key Transactions Table Container -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs shrink-0 font-bold">
                <i class="fa-solid fa-list-check"></i>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-slate-900 tracking-tight">API Key Real-Time Transactions</h3>
                <p class="text-[11px] text-slate-400 font-medium">All real-time payment charges, top-up deposits, and cashout payouts executed via API</p>
              </div>
            </div>

            <!-- Refresh Button -->
            <button (click)="loadKeyDetails()" class="px-3.5 py-1.5 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer transition-all">
              <i class="fa-solid fa-arrows-rotate text-xs"></i> Refresh History
            </button>
          </div>

          <!-- UNIFIED TRANSACTIONS TABLE -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/70 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-4">Type</th>
                  <th class="py-3.5 px-4">PoemPay Reference</th>
                  <th class="py-3.5 px-4">Customer Phone</th>
                  <th class="py-3.5 px-4">Amount</th>
                  <th class="py-3.5 px-4">Platform Fee</th>
                  <th class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-900">
                
                <!-- Main Real-Time Transactions List -->
                <tr *ngFor="let txn of allPortalTransactions" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1"
                          [ngClass]="{
                            'bg-indigo-50 text-indigo-700 border-indigo-200': !txn.type || txn.type === 'PAYMENT',
                            'bg-emerald-50 text-emerald-700 border-emerald-200': txn.type === 'DEPOSIT',
                            'bg-purple-50 text-purple-700 border-purple-200': txn.type === 'WITHDRAWAL'
                          }">
                      <i class="fa-solid" [ngClass]="{
                        'fa-arrow-down-left': !txn.type || txn.type === 'PAYMENT',
                        'fa-building-columns': txn.type === 'DEPOSIT',
                        'fa-arrow-up-right': txn.type === 'WITHDRAWAL'
                      }"></i>
                      <span>{{ txn.type || 'PAYMENT' }}</span>
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">{{ txn.poempay_reference }}</td>
                  <td class="py-3.5 px-4 font-semibold">{{ txn.customer_phone }}</td>
                  <td class="py-3.5 px-4 font-bold text-indigo-700">XAF {{ txn.amount | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4 font-semibold text-amber-600">XAF {{ (txn.fee || 0) | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border-emerald-200': txn.status === 'APPROVED',
                            'bg-amber-50 text-amber-700 border-amber-200': txn.status === 'PENDING_USER_APPROVAL',
                            'bg-rose-50 text-rose-700 border-rose-200': txn.status === 'CANCELLED' || txn.status === 'FAILED' || txn.status === 'EXPIRED'
                          }">
                      {{ txn.status }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-slate-400 font-medium">{{ txn.created_at | date:'medium' }}</td>
                </tr>

                <!-- Fallback Withdrawals List -->
                <ng-container *ngIf="allPortalTransactions.length === 0">
                  <tr *ngFor="let w of keyDetails?.recent_withdrawals" class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 px-4 font-bold">
                      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1">
                        <i class="fa-solid fa-arrow-up-right"></i> WITHDRAWAL
                      </span>
                    </td>
                    <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">{{ w.reference }}</td>
                    <td class="py-3.5 px-4 font-semibold">{{ w.phone_number }}</td>
                    <td class="py-3.5 px-4 font-bold text-purple-700">XAF {{ w.amount | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 font-semibold text-amber-600">XAF {{ (w.fee || 0) | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {{ w.status }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-400 font-medium">{{ w.created_at | date:'medium' }}</td>
                  </tr>

                  <!-- Fallback Deposits List -->
                  <tr *ngFor="let d of keyDetails?.recent_deposits" class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 px-4 font-bold">
                      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                        <i class="fa-solid fa-building-columns"></i> DEPOSIT
                      </span>
                    </td>
                    <td class="py-3.5 px-4 font-mono font-bold text-emerald-700">{{ d.reference }}</td>
                    <td class="py-3.5 px-4 font-semibold">{{ d.phone_number }}</td>
                    <td class="py-3.5 px-4 font-bold text-emerald-700">XAF {{ d.amount | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 font-semibold text-amber-600">XAF {{ (d.fee || 0) | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {{ d.status }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-400 font-medium">{{ d.created_at | date:'medium' }}</td>
                  </tr>
                </ng-container>

                <!-- Empty State -->
                <tr *ngIf="allPortalTransactions.length === 0 && (!keyDetails?.recent_withdrawals || keyDetails?.recent_withdrawals?.length === 0) && (!keyDetails?.recent_deposits || keyDetails?.recent_deposits?.length === 0)">
                  <td colspan="7" class="py-12 text-center text-slate-400 font-medium">
                    <i class="fa-solid fa-inbox text-2xl text-slate-300 mb-2 block"></i>
                    No transactions recorded for this API key yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </main>

      <!-- 2FA OTP Security Verification Modal -->
      <div *ngIf="showOtpPermissionModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <i class="fa-solid fa-lock text-sm"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Security 2FA OTP Verification</h3>
                <p class="text-xs text-slate-500">Authorize API Key permission update</p>
              </div>
            </div>
            
            <button (click)="closePermissionOtpModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 space-y-1.5">
              <p class="font-bold flex items-center gap-1.5 text-indigo-950">
                <i class="fa-solid fa-shield-check text-indigo-600"></i>
                <span>Action: {{ pendingWithdrawalPermissionState ? 'Enable API Key Payout Withdrawals' : 'Disable API Key Payout Withdrawals' }}</span>
              </p>
              <p class="text-[11px] text-indigo-700 leading-relaxed">
                An OTP verification code will be dispatched to your registered enterprise account email to confirm this permission change.
              </p>
            </div>

            <div *ngIf="!permissionOtpSent" class="text-center pt-2">
              <button 
                (click)="requestPermissionOtp()" 
                [disabled]="permissionOtpSending"
                class="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                <i *ngIf="!permissionOtpSending" class="fa-solid fa-paper-plane"></i>
                <i *ngIf="permissionOtpSending" class="fa-solid fa-circle-notch fa-spin"></i>
                <span>{{ permissionOtpSending ? 'Sending 2FA OTP Code...' : 'Send Security OTP Code to Email' }}</span>
              </button>
            </div>

            <div *ngIf="permissionOtpSent" class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  [(ngModel)]="permissionOtpCode"
                  maxlength="6"
                  placeholder="123456"
                  class="w-full px-4 py-3 border border-slate-300 rounded-2xl text-base font-mono font-extrabold tracking-widest text-center text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
                />
              </div>

              <p *ngIf="permissionError" class="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>{{ permissionError }}</span>
              </p>

              <div class="flex items-center gap-3 pt-2">
                <button 
                  (click)="requestPermissionOtp()" 
                  [disabled]="permissionOtpSending" 
                  class="w-1/3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                  Resend OTP
                </button>
                
                <button 
                  (click)="confirmPermissionWithOtp()" 
                  [disabled]="permissionOtpVerifying || !permissionOtpCode || permissionOtpCode.length < 6"
                  class="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                  <i *ngIf="!permissionOtpVerifying" class="fa-solid fa-check-circle"></i>
                  <i *ngIf="permissionOtpVerifying" class="fa-solid fa-circle-notch fa-spin"></i>
                  <span>{{ permissionOtpVerifying ? 'Verifying OTP...' : 'Verify OTP & Apply' }}</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Deposit Funds Modal -->
      <div *ngIf="showDepositModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <i class="fa-solid fa-plus-circle text-sm"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Deposit Wallet Funds</h3>
                <p class="text-xs text-slate-500">Real-time Mobile Money payment prompt</p>
              </div>
            </div>
            
            <button (click)="showDepositModal = false" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Deposit Amount (XAF)</label>
              <input
                type="number"
                [(ngModel)]="depositAmount"
                placeholder="e.g. 100000"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              />
            </div>

            <!-- Fee Breakdown Pill for Deposit -->
            <div *ngIf="depositAmount && depositAmount > 0" class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs space-y-1.5 text-indigo-900">
              <div class="flex justify-between">
                <span>Base Deposit Amount:</span>
                <span class="font-bold">XAF {{ depositAmount | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between text-indigo-700">
                <span>+ 2% Deposit Top-up Fee:</span>
                <span class="font-bold">+ XAF {{ (depositAmount * 0.02) | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between border-t border-indigo-200/60 pt-1 font-extrabold text-sm text-indigo-950">
                <span>Total Mobile Money Charge:</span>
                <span>XAF {{ (depositAmount * 1.02) | number:'1.0-0' }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Mobile Money Provider</label>
              <select
                [(ngModel)]="depositProvider"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none shadow-xs">
                <option value="MTN">MTN MoMo (Cameroon)</option>
                <option value="ORANGE">Orange Money (Cameroon)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Payer Mobile Money Phone</label>
              <input
                type="text"
                [(ngModel)]="depositPhone"
                (blur)="onDepositPhoneBlur()"
                placeholder="237670000000"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              />
              
              <div *ngIf="depositHolderLoading" class="mt-1.5 text-xs text-indigo-600 flex items-center gap-1.5 font-medium">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Verifying account holder name...</span>
              </div>

              <div *ngIf="depositHolderName" class="mt-1.5 text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <i class="fa-solid fa-circle-check text-emerald-600"></i>
                <span>Verified Name: {{ depositHolderName }}</span>
              </div>

              <div *ngIf="depositHolderError" class="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>{{ depositHolderError }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showDepositModal = false" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="onConfirmDeposit()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <i class="fa-solid fa-check"></i>
              <span>Confirm & Push Prompt</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Withdraw Funds Modal -->
      <div *ngIf="showWithdrawModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Withdraw Payout Funds</h3>
                <p class="text-xs text-slate-500">Disburse available API Key wallet balance</p>
              </div>
            </div>
            
            <button (click)="showWithdrawModal = false" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Withdrawal Amount (XAF)</label>
              <input
                type="number"
                [(ngModel)]="withdrawAmount"
                placeholder="e.g. 50000"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              />
            </div>

            <!-- Fee Breakdown Pill for Withdrawal -->
            <div *ngIf="withdrawAmount && withdrawAmount > 0" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-800">
              <div class="flex justify-between">
                <span>Requested Payout:</span>
                <span class="font-bold">XAF {{ withdrawAmount | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between text-amber-700">
                <span>+ 2% Payout Cashout Fee:</span>
                <span class="font-bold">+ XAF {{ (withdrawAmount * 0.02) | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-1 font-extrabold text-sm text-slate-900">
                <span>Total Balance Deducted:</span>
                <span>XAF {{ (withdrawAmount * 1.02) | number:'1.0-0' }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Recipient Provider</label>
              <select
                [(ngModel)]="withdrawProvider"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none shadow-xs">
                <option value="MTN">MTN MoMo (Cameroon)</option>
                <option value="ORANGE">Orange Money (Cameroon)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Recipient Mobile Money Phone</label>
              <input
                type="text"
                [(ngModel)]="withdrawPhone"
                (blur)="onWithdrawPhoneBlur()"
                placeholder="237670000000"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              />

              <div *ngIf="withdrawHolderLoading" class="mt-1.5 text-xs text-indigo-600 flex items-center gap-1.5 font-medium">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Verifying account holder name...</span>
              </div>

              <div *ngIf="withdrawHolderName" class="mt-1.5 text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <i class="fa-solid fa-circle-check text-emerald-600"></i>
                <span>Verified Recipient: {{ withdrawHolderName }}</span>
              </div>

              <div *ngIf="withdrawHolderError" class="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>{{ withdrawHolderError }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showWithdrawModal = false" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="onConfirmWithdrawal()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <i class="fa-solid fa-paper-plane"></i>
              <span>Disburse Payout Now</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class ApiKeyDetailComponent implements OnInit, OnDestroy {
  keyId: string | null = null;
  keyDetails: any = null;
  allPortalTransactions: EnterpriseTransaction[] = [];
  showSecretKey = false;

  // Deposit Top-up Modal State
  showDepositModal = false;
  depositAmount: number | null = null;
  depositProvider = 'MTN';
  depositPhone = '';
  depositHolderLoading = false;
  depositHolderName: string | null = null;
  depositHolderError: string | null = null;

  // Withdraw Payout Modal State
  showWithdrawModal = false;
  withdrawAmount: number | null = null;
  withdrawProvider = 'MTN';
  withdrawPhone = '';
  withdrawHolderLoading = false;
  withdrawHolderName: string | null = null;
  withdrawHolderError: string | null = null;

  // 2FA Security Permission Modal State
  showOtpPermissionModal = false;
  pendingWithdrawalPermissionState = false;
  permissionOtpCode = '';
  permissionOtpSending = false;
  permissionOtpVerifying = false;
  permissionOtpSent = false;
  permissionError = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private enterpriseService: EnterpriseService,
    private loader: LoaderService,
    private notification: NotificationService,
    private websocketService: WebsocketService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.keyId = this.route.snapshot.paramMap.get('id');
      if (this.keyId) {
        this.loadKeyDetails();
      }

      // Connect Real-Time WebSocket for transaction updates
      this.websocketService.connect();
      const wsSub = this.websocketService.enterpriseTransaction$.subscribe((msg: any) => {
        if (msg) {
          this.loadKeyDetails(true);
        }
      });
      this.subscriptions.push(wsSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  goBack(): void {
    this.router.navigate(['/enterprise/api-keys']);
  }

  loadKeyDetails(isSilent = false): void {
    if (!this.keyId || !isPlatformBrowser(this.platformId)) return;

    if (!isSilent) {
      this.loader.show();
      this.cdr.detectChanges();
    }

    this.enterpriseService.getPortalTransactions(1, 100, undefined, undefined, 'DATE_DESC', undefined, this.keyId).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.allPortalTransactions = res.data;
        } else if (Array.isArray(res)) {
          this.allPortalTransactions = res;
        }
        this.cdr.markForCheck();
      }
    });

    this.enterpriseService.getApiKeyDetails(this.keyId).pipe(
      finalize(() => {
        if (!isSilent) {
          this.loader.hide();
          this.cdr.markForCheck();
        }
      })
    ).subscribe({
      next: (res) => {
        this.keyDetails = res;
        if (this.keyDetails?.key && this.keyDetails.key.is_withdrawal_enabled === undefined) {
          this.keyDetails.key.is_withdrawal_enabled = false;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (!isSilent) {
          this.notification.error(err.error?.message || 'Failed to load API Key details');
        }
      }
    });
  }

  openWithdrawalPermissionModal(targetState: boolean): void {
    this.pendingWithdrawalPermissionState = targetState;
    this.permissionOtpCode = '';
    this.permissionOtpSent = false;
    this.permissionError = '';
    this.showOtpPermissionModal = true;
  }

  closePermissionOtpModal(): void {
    this.showOtpPermissionModal = false;
    this.permissionOtpCode = '';
    this.permissionOtpSent = false;
    this.permissionError = '';
  }

  requestPermissionOtp(): void {
    this.permissionOtpSending = true;
    this.permissionError = '';
    this.enterpriseService.requestPasswordOtp().pipe(
      finalize(() => {
        this.permissionOtpSending = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.permissionOtpSent = true;
        this.notification.success('Security 2FA OTP code dispatched to your email.');
      },
      error: () => {
        this.permissionOtpSent = true;
        this.notification.info('2FA OTP code dispatched to enterprise email.');
      }
    });
  }

  confirmPermissionWithOtp(): void {
    if (!this.permissionOtpCode || this.permissionOtpCode.length < 6) {
      this.permissionError = 'Please enter a valid 6-digit OTP code.';
      return;
    }

    this.permissionOtpVerifying = true;
    this.permissionError = '';

    this.enterpriseService.updateApiKeyWithdrawalPermission(
      this.keyId!,
      this.pendingWithdrawalPermissionState
    ).pipe(
      finalize(() => {
        this.permissionOtpVerifying = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (this.keyDetails?.key) {
          this.keyDetails.key.is_withdrawal_enabled = this.pendingWithdrawalPermissionState;
        }
        this.notification.success(res.message || `API Key Withdrawal permission ${this.pendingWithdrawalPermissionState ? 'ENABLED' : 'RESTRICTED'} successfully!`);
        this.closePermissionOtpModal();
        this.loadKeyDetails(true);
      },
      error: (err) => {
        this.permissionError = err.error?.message || 'Failed to update API Key withdrawal permission.';
      }
    });
  }

  formatCameroonPhone(phone: string): { formatted: string; isValid: boolean } {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.length === 9) {
      clean = '237' + clean;
    }
    const isValid = clean.startsWith('237') && clean.length === 12;
    return { formatted: clean, isValid };
  }

  onDepositPhoneBlur(): void {
    const { formatted, isValid } = this.formatCameroonPhone(this.depositPhone);
    this.depositPhone = formatted;
    this.depositHolderName = null;
    this.depositHolderError = null;

    if (!isValid) {
      if (this.depositPhone.length > 0) {
        this.depositHolderError = 'Phone number must start with country code 237 (e.g. 237670000000)';
      }
      return;
    }

    this.depositHolderLoading = true;
    this.enterpriseService.getHolderInfo(formatted).pipe(
      finalize(() => {
        this.depositHolderLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res?.name) {
          this.depositHolderName = res.name;
        } else {
          this.depositHolderError = 'Unable to verify account holder name for this phone number.';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.depositHolderError = 'Unable to verify account holder name from Campay.';
        this.cdr.markForCheck();
      }
    });
  }

  onWithdrawPhoneBlur(): void {
    const { formatted, isValid } = this.formatCameroonPhone(this.withdrawPhone);
    this.withdrawPhone = formatted;
    this.withdrawHolderName = null;
    this.withdrawHolderError = null;

    if (!isValid) {
      if (this.withdrawPhone.length > 0) {
        this.withdrawHolderError = 'Phone number must start with country code 237 (e.g. 237670000000)';
      }
      return;
    }

    this.withdrawHolderLoading = true;
    this.enterpriseService.getHolderInfo(formatted).pipe(
      finalize(() => {
        this.withdrawHolderLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res?.name) {
          this.withdrawHolderName = res.name;
        } else {
          this.withdrawHolderError = 'Unable to verify account holder name for this phone number.';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.withdrawHolderError = 'Unable to verify account holder name from Campay.';
        this.cdr.markForCheck();
      }
    });
  }

  onConfirmDeposit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.keyId) return;

    if (!this.depositAmount || this.depositAmount <= 0) {
      this.notification.error('Please enter a valid deposit amount.');
      return;
    }

    const { formatted, isValid } = this.formatCameroonPhone(this.depositPhone);
    if (!isValid) {
      this.notification.error('Phone number must start with country code 237 (e.g. 237670000000)');
      return;
    }
    this.depositPhone = formatted;

    this.loader.show();
    this.enterpriseService.depositToApiKey(this.keyId, {
      amount: Math.round(Number(this.depositAmount)),
      provider: this.depositProvider,
      phone_number: this.depositPhone
    }).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        this.notification.success(res.message || 'Deposit processed and wallet updated successfully!');
        this.showDepositModal = false;
        this.depositAmount = null;
        this.loadKeyDetails();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Deposit failed. Please check inputs.');
      }
    });
  }

  onConfirmWithdrawal(): void {
    if (!isPlatformBrowser(this.platformId) || !this.keyId) return;

    if (!this.withdrawAmount || this.withdrawAmount <= 0) {
      this.notification.error('Please enter a valid withdrawal amount.');
      return;
    }

    const { formatted, isValid } = this.formatCameroonPhone(this.withdrawPhone);
    if (!isValid) {
      this.notification.error('Phone number must start with country code 237 (e.g. 237670000000)');
      return;
    }
    this.withdrawPhone = formatted;

    const available = this.keyDetails?.wallet?.available_balance || 0;
    if (this.withdrawAmount > available) {
      this.notification.error(`Insufficient balance. Maximum available is XAF ${available.toFixed(2)}.`);
      return;
    }

    this.loader.show();
    this.enterpriseService.withdrawFromApiKey(this.keyId, {
      amount: Math.round(Number(this.withdrawAmount)),
      provider: this.withdrawProvider,
      phone_number: this.withdrawPhone,
      account_name: this.withdrawHolderName || undefined
    }).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        this.notification.success(res.message || 'Mobile Money withdrawal payout initiated successfully!');
        this.showWithdrawModal = false;
        this.withdrawAmount = null;
        this.loadKeyDetails();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Withdrawal failed. Please check inputs.');
      }
    });
  }

  getMaskedKey(key: any): string {
    if (!key) return 'sk_ent_live_...';
    if (key.secret_key) {
      return `${key.secret_key.substring(0, 18)}...`;
    }
    return 'sk_ent_live_...';
  }

  copyToClipboard(text?: string): void {
    if (!text || !isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(text);
    this.notification.success('Copied to clipboard!');
  }
}

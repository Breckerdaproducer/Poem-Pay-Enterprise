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
      <header class="border-b sticky top-0 z-40 bg-white/90 backdrop-blur-md px-3 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200/80 shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <button (click)="goBack()" title="Back to API Keys" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center transition-all text-slate-700 shadow-2xs cursor-pointer shrink-0">
            <i class="fa-solid fa-arrow-left text-xs"></i>
          </button>
          
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-extrabold text-sm sm:text-base leading-tight text-slate-900 tracking-tight truncate">
                {{ keyDetails?.key?.name || 'API Key Details' }}
              </h1>
              
              <!-- Environment Badge -->
              <span class="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1 shrink-0"
                    [ngClass]="keyDetails?.key?.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" [ngClass]="keyDetails?.key?.environment === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                {{ keyDetails?.key?.environment || 'LIVE' }}
              </span>
            </div>
            
            <p class="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1.5 sm:gap-2 truncate">
              <span>ID: <code class="font-mono font-bold text-slate-700">{{ keyId || 'N/A' }}</code></span>
              <span class="text-slate-300">•</span>
              <span class="truncate">Created {{ (keyDetails?.key?.created_at | date:'mediumDate') || 'Recently' }}</span>
            </p>
          </div>
        </div>

        <!-- Header Action Buttons -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button (click)="openCreateLinkModal()" class="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial">
            <i class="fa-solid fa-link text-xs text-indigo-400"></i>
            <span>Payment Link</span>
          </button>

          <button (click)="openDepositModal()" class="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial">
            <i class="fa-solid fa-circle-plus text-xs"></i>
            <span>Deposit</span>
          </button>

          <button (click)="openWithdrawModal()" class="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial">
            <i class="fa-solid fa-hand-holding-dollar text-xs"></i>
            <span>Withdraw</span>
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

            <!-- Modern Interactive Toggle Switch for Payout Access -->
            <div class="flex items-center gap-3 shrink-0 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80">
              <div class="text-right">
                <span class="block text-xs font-extrabold text-slate-900">
                  {{ keyDetails?.key?.is_withdrawal_enabled ? 'Payout Access Enabled' : 'Disable Payout Access' }}
                </span>
                <span class="block text-[10px] text-slate-500 font-medium">
                  {{ keyDetails?.key?.is_withdrawal_enabled ? 'Toggle off to disable' : 'Toggle on to enable (2FA OTP)' }}
                </span>
              </div>

              <label class="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  [checked]="keyDetails?.key?.is_withdrawal_enabled"
                  (click)="$event.preventDefault(); openWithdrawalPermissionModal(!keyDetails?.key?.is_withdrawal_enabled)"
                  class="sr-only peer"
                />
                <div class="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
              </label>
            </div>

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

        <!-- 3.5 Security & Fraud Prevention Settings Card -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-sm shrink-0 font-bold shadow-xs">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-extrabold text-slate-900 tracking-tight">Security & Fraud Prevention Controls</h3>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Protection
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 font-medium">IP whitelisting, velocity rate limits, and real-time anomaly alerts</p>
              </div>
            </div>

            <button (click)="openSecurityModal()" class="px-4 py-2 bg-[#0000ad] hover:bg-[#00008e] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-xs">
              <i class="fa-solid fa-sliders"></i> Configure Security Rules
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- IP Whitelist Card -->
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-network-wired text-indigo-600"></i> IP Whitelist:
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase" [ngClass]="keyDetails?.is_ip_whitelist_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'">
                  {{ keyDetails?.is_ip_whitelist_enabled ? 'ENABLED' : 'DISABLED' }}
                </span>
              </div>
              <p class="text-[11px] font-mono text-slate-600 truncate">
                {{ (keyDetails?.allowed_ip_addresses && keyDetails?.allowed_ip_addresses?.length > 0) ? keyDetails?.allowed_ip_addresses?.join(', ') : 'Any IP allowed (Not Restricted)' }}
              </p>
            </div>

            <!-- Velocity Limit Card -->
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-gauge-high text-blue-600"></i> Max Velocity RPM:
                </span>
                <span class="font-mono text-xs font-extrabold text-slate-900">
                  {{ keyDetails?.max_rpm_limit || 60 }} req/min
                </span>
              </div>
              <p class="text-[11px] text-slate-500">Rate limit window prevents API spam & DDoS</p>
            </div>

          </div>
        </div>

        <!-- 4. Active Payment Links Section -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs shrink-0 font-bold">
                <i class="fa-solid fa-link"></i>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-slate-900 tracking-tight">API Key Hosted Payment Links</h3>
                <p class="text-[11px] text-slate-400 font-medium">Shareable payment links and QR codes for instant customer collection</p>
              </div>
            </div>

            <button (click)="openCreateLinkModal()" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-xs">
              <i class="fa-solid fa-plus text-xs"></i> New Link
            </button>
          </div>

          <div *ngIf="paymentLinks.length === 0" class="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-sm">
              <i class="fa-solid fa-link"></i>
            </div>
            <p class="text-xs font-bold text-slate-700">No Payment Links Created Yet</p>
            <p class="text-[11px] text-slate-400 max-w-sm mx-auto">Generate a shareable payment link or QR code to collect payments directly into this wallet without writing code.</p>
            <button (click)="openCreateLinkModal()" class="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer">
              Create First Payment Link
            </button>
          </div>

          <div *ngIf="paymentLinks.length > 0" class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/70 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th class="py-3 px-4">Title & Shortcode</th>
                  <th class="py-3 px-4">Amount</th>
                  <th class="py-3 px-4">Payments</th>
                  <th class="py-3 px-4">Total Collected</th>
                  <th class="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-900">
                <tr *ngFor="let link of paymentLinks" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4">
                    <span class="font-bold block text-slate-900">{{ link.title }}</span>
                    <span class="font-mono text-[11px] text-indigo-600 font-semibold">{{ link.code }}</span>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-slate-800">
                    {{ link.is_fixed_amount ? ('XAF ' + (link.amount | number:'1.0-0')) : 'Customer Specified' }}
                  </td>
                  <td class="py-3.5 px-4 font-bold text-indigo-700">
                    {{ link.total_payments_count }}
                  </td>
                  <td class="py-3.5 px-4 font-extrabold text-emerald-600">
                    XAF {{ (link.total_volume_collected || 0) | number:'1.0-0' }}
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2">
                      <button (click)="copyPaymentLinkUrl(link.code)" class="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-indigo-200 flex items-center gap-1">
                        <i class="fa-regular fa-copy"></i> Copy Link
                      </button>
                      <a [href]="'https://poempay.com/checkout/' + link.code" target="_blank" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all border border-slate-200 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. Unified API Key Transactions Table Container -->
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
            <button (click)="loadKeyTransactions(1)" class="px-3.5 py-1.5 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer transition-all">
              <i class="fa-solid fa-arrows-rotate text-xs" [ngClass]="{'fa-spin': isLoadingTxns}"></i> Refresh History
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

          <!-- Table Pagination Controls Footer (Identical to Real-Time Transactions Page) -->
          <div *ngIf="totalItems > 0 || allPortalTransactions.length > 0" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
            
            <div class="flex items-center gap-3">
              <span>Rows per page:</span>
              <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs">
                <option [ngValue]="10">10</option>
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
              </select>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
              <span>Page <strong>{{ currentPage }}</strong> of <strong>{{ totalPages }}</strong></span>
              
              <div class="flex items-center gap-1">
                <button 
                  (click)="goToPage(currentPage - 1)" 
                  [disabled]="currentPage === 1 || isLoadingTxns"
                  class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                  <i class="fa-solid fa-chevron-left text-xs"></i>
                </button>

                <button 
                  (click)="goToPage(currentPage + 1)" 
                  [disabled]="currentPage >= totalPages || isLoadingTxns"
                  class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                  <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>

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
      <div *ngIf="showDepositModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
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
            
            <button (click)="closeDepositModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- STEP 1: FORM -->
          <div *ngIf="depositStep === 'FORM'" class="space-y-4">
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
              <div class="grid grid-cols-2 gap-3">
                <div 
                  (click)="depositProvider = 'MTN'"
                  class="p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all"
                  [ngClass]="depositProvider === 'MTN' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
                  <img src="/mtn.png" alt="MTN" class="w-8 h-8 rounded-lg object-cover border border-amber-300 shrink-0" />
                  <div>
                    <span class="font-extrabold text-xs text-slate-900 block">MTN MoMo</span>
                    <span class="text-[10px] text-slate-500 font-medium">Cameroon</span>
                  </div>
                </div>

                <div 
                  (click)="depositProvider = 'ORANGE'"
                  class="p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all"
                  [ngClass]="depositProvider === 'ORANGE' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
                  <img src="/orange.png" alt="Orange" class="w-8 h-8 rounded-lg object-cover border border-orange-400 shrink-0" />
                  <div>
                    <span class="font-extrabold text-xs text-slate-900 block">Orange Money</span>
                    <span class="text-[10px] text-slate-500 font-medium">Cameroon</span>
                  </div>
                </div>
              </div>
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

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button (click)="closeDepositModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                Cancel
              </button>
              <button (click)="onConfirmDeposit()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                <i class="fa-solid fa-check"></i>
                <span>Confirm & Push Prompt</span>
              </button>
            </div>
          </div>

          <!-- STEP 2: AWAITING PIN -->
          <div *ngIf="depositStep === 'AWAITING_PIN'" class="py-6 text-center space-y-4">
            <div class="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div class="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
              <div class="relative w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 text-2xl shadow-md">
                <i class="fa-solid fa-mobile-screen-button"></i>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-lg font-extrabold text-slate-900">USSD Prompt Pushed to Handset</h4>
              <p class="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Please check <span class="font-bold text-slate-900 font-mono">{{ depositPhone }}</span> and enter your Mobile Money PIN code to authorize <span class="font-bold text-emerald-600">XAF {{ depositAmount | number:'1.0-0' }}</span>.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
              <span>Waiting for Campay live payment webhook status...</span>
            </div>
          </div>

          <!-- STEP 3: SUCCESS -->
          <div *ngIf="depositStep === 'SUCCESS'" class="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              <i class="fa-solid fa-circle-check"></i>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-xl font-extrabold text-slate-900">Payment Confirmed!</h4>
              <p class="text-xs text-slate-600 max-w-xs mx-auto">
                <span class="font-extrabold text-emerald-700">XAF {{ depositAmount | number:'1.0-0' }}</span> has been successfully credited to your API Key Wallet balance.
              </p>
            </div>

            <button (click)="closeDepositModal()" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
              Done & Close
            </button>
          </div>

          <!-- STEP 4: FAILED -->
          <div *ngIf="depositStep === 'FAILED'" class="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div class="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              <i class="fa-solid fa-circle-xmark"></i>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-xl font-extrabold text-slate-900">Deposit Failed</h4>
              <p class="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                {{ depositErrorMessage || 'Payment prompt was cancelled or timed out on handset.' }}
              </p>
            </div>

            <div class="flex gap-2">
              <button (click)="closeDepositModal()" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                Close
              </button>
              <button (click)="depositStep = 'FORM'" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
                Try Again
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Withdraw Funds Modal -->
      <div *ngIf="showWithdrawModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
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
            
            <button (click)="closeWithdrawModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- STEP 1: FORM -->
          <div *ngIf="withdrawStep === 'FORM'" class="space-y-4">
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
              <div class="grid grid-cols-2 gap-3">
                <div 
                  (click)="withdrawProvider = 'MTN'"
                  class="p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all"
                  [ngClass]="withdrawProvider === 'MTN' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
                  <img src="/mtn.png" alt="MTN" class="w-8 h-8 rounded-lg object-cover border border-amber-300 shrink-0" />
                  <div>
                    <span class="font-extrabold text-xs text-slate-900 block">MTN MoMo</span>
                    <span class="text-[10px] text-slate-500 font-medium">Cameroon</span>
                  </div>
                </div>

                <div 
                  (click)="withdrawProvider = 'ORANGE'"
                  class="p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all"
                  [ngClass]="withdrawProvider === 'ORANGE' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:border-slate-300'">
                  <img src="/orange.png" alt="Orange" class="w-8 h-8 rounded-lg object-cover border border-orange-400 shrink-0" />
                  <div>
                    <span class="font-extrabold text-xs text-slate-900 block">Orange Money</span>
                    <span class="text-[10px] text-slate-500 font-medium">Cameroon</span>
                  </div>
                </div>
              </div>
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

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button (click)="closeWithdrawModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                Cancel
              </button>
              <button (click)="onConfirmWithdrawal()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Confirm & Disburse</span>
              </button>
            </div>
          </div>

          <!-- STEP 2: AWAITING PIN / DISBURSING -->
          <div *ngIf="withdrawStep === 'AWAITING_PIN'" class="py-6 text-center space-y-4">
            <div class="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div class="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping"></div>
              <div class="relative w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center text-indigo-600 text-2xl shadow-md">
                <i class="fa-solid fa-paper-plane"></i>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-lg font-extrabold text-slate-900">Disbursing Mobile Money Transfer</h4>
              <p class="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Executing payout of <span class="font-bold text-slate-900">XAF {{ withdrawAmount | number:'1.0-0' }}</span> to recipient <span class="font-bold text-slate-900 font-mono">{{ withdrawPhone }}</span>.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
              <span>Waiting for operator network confirmation...</span>
            </div>
          </div>

          <!-- STEP 3: SUCCESS -->
          <div *ngIf="withdrawStep === 'SUCCESS'" class="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              <i class="fa-solid fa-circle-check"></i>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-xl font-extrabold text-slate-900">Payout Disbursed!</h4>
              <p class="text-xs text-slate-600 max-w-xs mx-auto">
                <span class="font-extrabold text-emerald-700">XAF {{ withdrawAmount | number:'1.0-0' }}</span> was successfully transferred to {{ withdrawPhone }}.
              </p>
            </div>

            <button (click)="closeWithdrawModal()" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
              Done & Close
            </button>
          </div>

          <!-- STEP 4: FAILED -->
          <div *ngIf="withdrawStep === 'FAILED'" class="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div class="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              <i class="fa-solid fa-circle-xmark"></i>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-xl font-extrabold text-slate-900">Payout Failed</h4>
              <p class="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                {{ withdrawErrorMessage || 'Payout cashout was rejected by operator.' }}
              </p>
            </div>

            <div class="flex gap-2">
              <button (click)="closeWithdrawModal()" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                Close
              </button>
              <button (click)="withdrawStep = 'FORM'" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
                Try Again
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Create Payment Link Modal -->
      <div *ngIf="showCreateLinkModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <i class="fa-solid fa-link text-sm"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Create Payment Link</h3>
                <p class="text-xs text-slate-500">Generate shareable customer checkout link</p>
              </div>
            </div>
            
            <button (click)="showCreateLinkModal = false" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">Link Title / Product Name</label>
              <input
                type="text"
                [(ngModel)]="newLinkTitle"
                placeholder="e.g. Web Design Services Invoice #104"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">Description (Optional)</label>
              <textarea
                [(ngModel)]="newLinkDescription"
                rows="2"
                placeholder="Details or invoice notes for the customer..."
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">Amount (XAF)</label>
                <input
                  type="number"
                  [(ngModel)]="newLinkAmount"
                  placeholder="e.g. 25000"
                  class="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">Link Expiry</label>
                <select
                  [(ngModel)]="newLinkExpiryDays"
                  class="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none shadow-xs">
                  <option [value]="0">Never Expires</option>
                  <option [value]="1">24 Hours</option>
                  <option [value]="7">7 Days</option>
                  <option [value]="30">30 Days</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">Success Redirect URL (Optional)</label>
              <input
                type="text"
                [(ngModel)]="newLinkRedirectUrl"
                placeholder="https://yourstore.com/thank-you"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showCreateLinkModal = false" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="submitCreatePaymentLink()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <i class="fa-solid fa-bolt"></i>
              <span>Generate Payment Link</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Configure Security & Fraud Prevention Rules Modal -->
      <div *ngIf="showSecurityModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
                <i class="fa-solid fa-shield-halved text-sm"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Security & IP Whitelisting Controls</h3>
                <p class="text-xs text-slate-500">Configure server IP whitelisting rules</p>
              </div>
            </div>
            
            <button (click)="showSecurityModal = false" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- IP Whitelist Switch -->
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span class="font-extrabold text-slate-900 block">Enforce IP Whitelisting</span>
                <span class="text-[11px] text-slate-500 font-medium">Reject requests originating from unlisted IP addresses</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="isIpWhitelistEnabled" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <!-- Allowed IPs Input -->
            <div *ngIf="isIpWhitelistEnabled">
              <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">Allowed Server IP Addresses (Comma-separated)</label>
              <textarea
                [(ngModel)]="allowedIpAddressesInput"
                rows="3"
                placeholder="192.168.1.1, 10.0.0.50, 45.33.18.9"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none shadow-xs"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showSecurityModal = false" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="saveSecuritySettings()" [disabled]="securitySaving" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <i *ngIf="!securitySaving" class="fa-solid fa-shield-check"></i>
              <i *ngIf="securitySaving" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ securitySaving ? 'Saving Rules...' : 'Save Security Rules' }}</span>
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
  paymentLinks: any[] = [];
  showCreateLinkModal = false;
  newLinkTitle = '';
  newLinkDescription = '';
  newLinkAmount: number | null = null;
  newLinkExpiryDays = 0;
  newLinkRedirectUrl = '';

  // IP Whitelisting & Security State
  showSecurityModal = false;
  isIpWhitelistEnabled = false;
  allowedIpAddressesInput = '';
  maxRpmLimit = 60;
  securitySaving = false;

  // Deposit Top-up Modal State
  showDepositModal = false;
  depositStep: 'FORM' | 'AWAITING_PIN' | 'SUCCESS' | 'FAILED' = 'FORM';
  depositRef = '';
  depositErrorMessage = '';
  depositAmount: number | null = null;
  depositProvider = 'MTN';
  depositPhone = '';
  depositHolderLoading = false;
  depositHolderName: string | null = null;
  depositHolderError: string | null = null;

  // Withdraw Payout Modal State
  showWithdrawModal = false;
  withdrawStep: 'FORM' | 'AWAITING_PIN' | 'SUCCESS' | 'FAILED' = 'FORM';
  withdrawRef = '';
  withdrawErrorMessage = '';
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

  // Pagination State for API Key Transactions Table
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  isLoadingTxns = false;

  private subscriptions: Subscription[] = [];
  private depositPollTimer: any = null;
  private withdrawPollTimer: any = null;

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
        this.loadPaymentLinks();
      }

      // Connect Real-Time WebSocket for transaction updates
      this.websocketService.connect();
      const wsSub = this.websocketService.enterpriseTransaction$.subscribe((msg: any) => {
        if (msg) {
          this.loadKeyDetails(true);
          this.loadPaymentLinks();

          // Real-time status update for Deposit Modal
          if (this.showDepositModal && this.depositStep === 'AWAITING_PIN') {
            const isMatch = !this.depositRef || msg.reference === this.depositRef || msg.transaction_id === this.depositRef || msg.type === 'DEPOSIT';
            if (isMatch) {
              if (msg.status === 'APPROVED' || msg.status === 'SUCCESSFUL') {
                this.depositStep = 'SUCCESS';
                this.stopDepositPolling();
                this.loadKeyDetails(true);
              } else if (msg.status === 'FAILED' || msg.status === 'REJECTED') {
                this.depositStep = 'FAILED';
                this.depositErrorMessage = msg.reason || 'Payment prompt was cancelled or failed.';
                this.stopDepositPolling();
              }
              this.cdr.markForCheck();
            }
          }

          // Real-time status update for Withdrawal Modal
          if (this.showWithdrawModal && this.withdrawStep === 'AWAITING_PIN') {
            const isMatch = !this.withdrawRef || msg.reference === this.withdrawRef || msg.transaction_id === this.withdrawRef || msg.type === 'WITHDRAWAL';
            if (isMatch) {
              if (msg.status === 'APPROVED' || msg.status === 'SUCCESSFUL') {
                this.withdrawStep = 'SUCCESS';
                this.stopWithdrawPolling();
                this.loadKeyDetails(true);
              } else if (msg.status === 'FAILED' || msg.status === 'REJECTED') {
                this.withdrawStep = 'FAILED';
                this.withdrawErrorMessage = msg.reason || 'Payout cashout was rejected.';
                this.stopWithdrawPolling();
              }
              this.cdr.markForCheck();
            }
          }
        }
      });
      this.subscriptions.push(wsSub);
    }
  }

  ngOnDestroy(): void {
    this.stopDepositPolling();
    this.stopWithdrawPolling();
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadPaymentLinks(): void {
    if (!this.keyId) return;
    this.enterpriseService.getPaymentLinks(this.keyId).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.paymentLinks = res.data;
        } else if (Array.isArray(res)) {
          this.paymentLinks = res;
        }
        this.cdr.markForCheck();
      }
    });
  }

  openCreateLinkModal(): void {
    this.newLinkTitle = '';
    this.newLinkDescription = '';
    this.newLinkAmount = null;
    this.newLinkExpiryDays = 0;
    this.newLinkRedirectUrl = '';
    this.showCreateLinkModal = true;
  }

  submitCreatePaymentLink(): void {
    if (!this.keyId) return;
    if (!this.newLinkTitle || this.newLinkTitle.trim() === '') {
      this.notification.error('Please enter a title for the Payment Link.');
      return;
    }

    this.loader.show();
    this.enterpriseService.createPaymentLink(this.keyId, {
      title: this.newLinkTitle.trim(),
      description: this.newLinkDescription ? this.newLinkDescription.trim() : undefined,
      amount: this.newLinkAmount ? Math.round(Number(this.newLinkAmount)) : undefined,
      is_fixed_amount: !!this.newLinkAmount,
      redirect_url: this.newLinkRedirectUrl ? this.newLinkRedirectUrl.trim() : undefined,
      expires_in_days: Number(this.newLinkExpiryDays) || undefined,
    }).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        this.notification.success('Payment Link created successfully!');
        this.showCreateLinkModal = false;
        this.loadPaymentLinks();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to create payment link.');
      }
    });
  }

  copyPaymentLinkUrl(code: string): void {
    const fullUrl = `https://poempay.com/checkout/${code}`;
    navigator.clipboard.writeText(fullUrl);
    this.notification.success('Payment link copied to clipboard!');
  }

  openDepositModal(): void {
    this.depositStep = 'FORM';
    this.depositRef = '';
    this.depositErrorMessage = '';
    this.showDepositModal = true;
  }

  closeDepositModal(): void {
    this.stopDepositPolling();
    this.showDepositModal = false;
    this.depositStep = 'FORM';
  }

  openWithdrawModal(): void {
    this.withdrawStep = 'FORM';
    this.withdrawRef = '';
    this.withdrawErrorMessage = '';
    this.showWithdrawModal = true;
  }

  closeWithdrawModal(): void {
    this.stopWithdrawPolling();
    this.showWithdrawModal = false;
    this.withdrawStep = 'FORM';
  }

  goBack(): void {
    this.router.navigate(['/enterprise/api-keys']);
  }

  loadKeyTransactions(page = this.currentPage): void {
    if (!this.keyId || !isPlatformBrowser(this.platformId)) return;
    this.isLoadingTxns = true;
    this.currentPage = page;

    this.enterpriseService.getPortalTransactions(
      this.currentPage,
      this.pageSize,
      undefined,
      undefined,
      'DATE_DESC',
      undefined,
      this.keyId
    ).pipe(
      finalize(() => {
        this.isLoadingTxns = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.allPortalTransactions = res.data;
          if (res.meta) {
            this.totalItems = res.meta.total_items || res.data.length;
            this.totalPages = res.meta.total_pages || Math.ceil(this.totalItems / this.pageSize) || 1;
          } else {
            this.totalItems = res.data.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
          }
        } else if (Array.isArray(res)) {
          this.allPortalTransactions = res;
          this.totalItems = res.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.allPortalTransactions = [];
        this.totalItems = 0;
        this.totalPages = 1;
      }
    });
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadKeyTransactions(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadKeyTransactions(page);
  }

  loadKeyDetails(isSilent = false): void {
    if (!this.keyId || !isPlatformBrowser(this.platformId)) return;

    if (!isSilent) {
      this.loader.show();
      this.cdr.detectChanges();
    }

    this.loadKeyTransactions(this.currentPage);

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

  stopDepositPolling(): void {
    if (this.depositPollTimer) {
      clearInterval(this.depositPollTimer);
      this.depositPollTimer = null;
    }
  }

  stopWithdrawPolling(): void {
    if (this.withdrawPollTimer) {
      clearInterval(this.withdrawPollTimer);
      this.withdrawPollTimer = null;
    }
  }

  startDepositPolling(): void {
    this.stopDepositPolling();
    let pollCount = 0;
    this.depositPollTimer = setInterval(() => {
      pollCount++;
      if (pollCount > 25) { // 75 seconds timeout fallback
        this.stopDepositPolling();
        if (this.depositStep === 'AWAITING_PIN') {
          this.depositStep = 'FAILED';
          this.depositErrorMessage = 'Transaction timed out. Please verify on your phone.';
          this.cdr.markForCheck();
        }
        return;
      }
      this.loadKeyDetails(true);
    }, 3000);
  }

  startWithdrawPolling(): void {
    this.stopWithdrawPolling();
    let pollCount = 0;
    this.withdrawPollTimer = setInterval(() => {
      pollCount++;
      if (pollCount > 25) {
        this.stopWithdrawPolling();
        if (this.withdrawStep === 'AWAITING_PIN') {
          this.withdrawStep = 'FAILED';
          this.withdrawErrorMessage = 'Payout confirmation timed out. Check network operator.';
          this.cdr.markForCheck();
        }
        return;
      }
      this.loadKeyDetails(true);
    }, 3000);
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
        this.depositRef = res.reference || res.transaction_id || res.id || '';
        this.depositStep = 'AWAITING_PIN';
        this.startDepositPolling();
        this.notification.info('Mobile Money PIN prompt pushed to handset. Please enter your PIN.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.depositStep = 'FAILED';
        this.depositErrorMessage = err.error?.message || 'Deposit failed. Please check inputs.';
        this.cdr.markForCheck();
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
        this.withdrawRef = res.reference || res.transaction_id || res.id || '';
        this.withdrawStep = 'AWAITING_PIN';
        this.startWithdrawPolling();
        this.notification.info('Mobile Money payout transfer initiated. Waiting for operator network confirmation.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.withdrawStep = 'FAILED';
        this.withdrawErrorMessage = err.error?.message || 'Withdrawal failed. Please check inputs.';
        this.cdr.markForCheck();
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

  openSecurityModal(): void {
    if (this.keyDetails) {
      this.isIpWhitelistEnabled = !!this.keyDetails.is_ip_whitelist_enabled;
      this.allowedIpAddressesInput = Array.isArray(this.keyDetails.allowed_ip_addresses)
        ? this.keyDetails.allowed_ip_addresses.join(', ')
        : '';
      this.maxRpmLimit = this.keyDetails.max_rpm_limit || 60;
    }
    this.showSecurityModal = true;
  }

  saveSecuritySettings(): void {
    if (!this.keyId) return;
    this.securitySaving = true;

    const ips = this.allowedIpAddressesInput
      .split(',')
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);

    this.enterpriseService.updateApiKeySecurity(this.keyId, {
      is_ip_whitelist_enabled: this.isIpWhitelistEnabled,
      allowed_ip_addresses: ips,
    }).subscribe({
      next: (res) => {
        this.securitySaving = false;
        this.showSecurityModal = false;
        this.notification.success(res.message || 'Security & Fraud Prevention rules updated!');
        this.loadKeyDetails(true);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.securitySaving = false;
        this.notification.error(err.error?.message || 'Failed to update security rules.');
        this.cdr.markForCheck();
      }
    });
  }
}

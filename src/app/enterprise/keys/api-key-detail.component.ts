import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnterpriseService } from '../../services/enterprise.service';
import { NotificationService } from '../../services/notification.service';
import { LoaderService } from '../../services/loader.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-api-key-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      
      <!-- Top Navigation Header -->
      <header class="border-b sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between border-slate-200 shadow-xs">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all text-slate-700">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-extrabold text-base leading-tight text-slate-900">{{ keyDetails?.key?.name || 'API Key Overview' }}</h1>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    [ngClass]="keyDetails?.key?.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                {{ keyDetails?.key?.environment || 'LIVE' }}
              </span>
            </div>
            <p class="text-xs font-mono text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Secret Key: <strong class="text-indigo-700">{{ getMaskedKey(keyDetails?.key) }}</strong></span>
              <button (click)="copyToClipboard(keyDetails?.key?.secret_key)" 
                      title="Copy Secret API Key (sk_ent_...)"
                      class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-indigo-600 transition-colors text-[10px] font-sans font-bold inline-flex items-center gap-1 border border-slate-200">
                <i class="fa-solid fa-copy"></i> Copy Secret
              </button>
              <span class="text-slate-300">|</span>
              <span>Public Key: <strong class="text-slate-700">{{ keyDetails?.key?.public_key || 'N/A' }}</strong></span>
              <button (click)="copyToClipboard(keyDetails?.key?.public_key)" 
                      title="Copy Public Key (pk_ent_...)"
                      class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors text-[10px] font-sans font-bold inline-flex items-center gap-1 border border-slate-200">
                <i class="fa-solid fa-copy"></i> Copy Public
              </button>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="showDepositModal = true" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2">
            <i class="fa-solid fa-plus-circle text-xs"></i>
            <span>Deposit Funds</span>
          </button>

          <button (click)="showWithdrawModal = true" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2">
            <i class="fa-solid fa-hand-holding-dollar text-xs"></i>
            <span>Withdraw Funds</span>
          </button>
        </div>
      </header>

      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
        
        <!-- Key Info & Wallet KPI Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <!-- KPI 1: Available Balance -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100">
                <i class="fa-solid fa-wallet text-lg"></i>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Available Wallet</span>
            </div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">AVAILABLE WALLET BALANCE</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 tracking-tight">
              XAF {{ keyDetails?.wallet?.available_balance | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Ready for payouts or API usage</p>
          </div>

          <!-- KPI 2: Total Volume Processed -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 border border-indigo-100">
                <i class="fa-solid fa-chart-line text-lg"></i>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Gross Volume</span>
            </div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">TOTAL PROCESSED VOLUME</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-slate-900 tracking-tight">
              XAF {{ keyDetails?.wallet?.total_volume | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Via this API Key</p>
          </div>

          <!-- KPI 3: Total Deposited -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100">
                <i class="fa-solid fa-circle-arrow-down text-lg"></i>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Total Top-ups</span>
            </div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">TOTAL DEPOSITED</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-blue-600 tracking-tight">
              XAF {{ keyDetails?.wallet?.total_deposits | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Mobile Money Top-ups</p>
          </div>

          <!-- KPI 4: Total Withdrawn -->
          <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-100">
                <i class="fa-solid fa-building-columns text-lg"></i>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Total Payouts</span>
            </div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">TOTAL WITHDRAWN</p>
            <h3 class="text-2xl sm:text-3xl font-extrabold mt-1 text-slate-900 tracking-tight">
              XAF {{ keyDetails?.wallet?.total_withdrawn | number:'1.2-2' }}
            </h3>
            <p class="text-xs mt-2 font-medium text-slate-500">Cashouts processed</p>
          </div>

        </div>

        <!-- Wallet History Tables & Tabs -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            
            <div class="flex items-center gap-4">
              <button 
                (click)="activeHistoryTab = 'withdrawals'" 
                [class.border-indigo-600]="activeHistoryTab === 'withdrawals'" 
                [class.text-indigo-600]="activeHistoryTab === 'withdrawals'"
                class="pb-2 text-xs font-bold border-b-2 border-transparent transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
                <span>Withdrawal Payouts</span>
                <span class="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-full font-bold border border-indigo-200">{{ keyDetails?.recent_withdrawals?.length || 0 }}</span>
              </button>

              <button 
                (click)="activeHistoryTab = 'deposits'" 
                [class.border-emerald-600]="activeHistoryTab === 'deposits'" 
                [class.text-emerald-600]="activeHistoryTab === 'deposits'"
                class="pb-2 text-xs font-bold border-b-2 border-transparent transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <i class="fa-solid fa-arrow-down-to-bracket"></i>
                <span>Deposit Top-ups</span>
                <span class="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200">{{ keyDetails?.recent_deposits?.length || 0 }}</span>
              </button>
            </div>

            <button (click)="loadKeyDetails()" class="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100">
              <i class="fa-solid fa-arrows-rotate text-xs"></i> Refresh History
            </button>
          </div>

          <!-- TAB 1: WITHDRAWALS TABLE -->
          <div *ngIf="activeHistoryTab === 'withdrawals'" class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3 px-4">Payout Ref</th>
                  <th class="py-3 px-4">Provider</th>
                  <th class="py-3 px-4">Recipient Phone</th>
                  <th class="py-3 px-4">Account Holder</th>
                  <th class="py-3 px-4">Amount</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-900">
                <tr *ngFor="let w of keyDetails?.recent_withdrawals" class="hover:bg-slate-50 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">{{ w.reference }}</td>
                  <td class="py-3.5 px-4 font-bold">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border" [ngClass]="w.provider === 'MTN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-700 border-orange-200'">
                      {{ w.provider }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-semibold">{{ w.phone_number }}</td>
                  <td class="py-3.5 px-4 text-slate-600">{{ w.account_name || 'N/A' }}</td>
                  <td class="py-3.5 px-4 font-bold text-purple-700">XAF {{ w.amount | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {{ w.status }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-slate-400">{{ w.created_at | date:'medium' }}</td>
                </tr>
                <tr *ngIf="!keyDetails?.recent_withdrawals || keyDetails?.recent_withdrawals?.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-400">No withdrawals recorded for this API key yet. Click "Withdraw Funds" above to cash out.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- TAB 2: DEPOSITS TABLE -->
          <div *ngIf="activeHistoryTab === 'deposits'" class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3 px-4">Deposit Ref</th>
                  <th class="py-3 px-4">Provider</th>
                  <th class="py-3 px-4">Payer Phone</th>
                  <th class="py-3 px-4">Amount</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-900">
                <tr *ngFor="let d of keyDetails?.recent_deposits" class="hover:bg-slate-50 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-emerald-700">{{ d.reference }}</td>
                  <td class="py-3.5 px-4 font-bold">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border" [ngClass]="d.provider === 'MTN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-700 border-orange-200'">
                      {{ d.provider }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-semibold">{{ d.phone_number }}</td>
                  <td class="py-3.5 px-4 font-bold text-emerald-700">XAF {{ d.amount | number:'1.2-2' }}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {{ d.status }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-slate-400">{{ d.created_at | date:'medium' }}</td>
                </tr>
                <tr *ngIf="!keyDetails?.recent_deposits || keyDetails?.recent_deposits?.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400">No deposit top-ups recorded for this API key yet. Click "Deposit Funds" above to add money.</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </main>

      <!-- Deposit Funds Modal -->
      <div *ngIf="showDepositModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-900">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-plus-circle text-emerald-600"></i> Deposit Wallet Funds
              </h3>
              <p class="text-xs text-slate-500">Real-time Mobile Money payment prompt</p>
            </div>
            <button (click)="showDepositModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Deposit Amount (XAF)</label>
              <input
                type="number"
                [(ngModel)]="depositAmount"
                placeholder="e.g. 100000"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <!-- Fee Breakdown Pill for Deposit -->
            <div *ngIf="depositAmount && depositAmount > 0" class="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-1.5 text-indigo-900">
              <div class="flex justify-between">
                <span>Base Deposit Amount:</span>
                <span class="font-bold">XAF {{ depositAmount | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between text-indigo-700">
                <span>+ 2% Deposit Top-up Fee:</span>
                <span class="font-bold">+ XAF {{ (depositAmount * 0.02) | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between pt-1.5 border-t border-indigo-200 font-extrabold text-sm text-indigo-900">
                <span>Total Charge & Wallet Credit:</span>
                <span>XAF {{ (depositAmount * 1.02) | number:'1.0-0' }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Mobile Money Provider</label>
              <select
                [(ngModel)]="depositProvider"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="MTN">MTN MoMo (Cameroon)</option>
                <option value="ORANGE">Orange Money (Cameroon)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Payer Phone Number</label>
              <input
                type="text"
                [(ngModel)]="depositPhone"
                (blur)="onDepositPhoneBlur()"
                placeholder="237670000000"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              <div *ngIf="depositHolderLoading" class="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 mt-2">
                <i class="fa-solid fa-circle-notch fa-spin text-xs"></i> Verifying account holder with Campay...
              </div>
              <div *ngIf="depositHolderName" class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 mt-2 font-medium">
                <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                <span>Account Holder Name: <strong class="font-extrabold text-slate-900">{{ depositHolderName }}</strong></span>
              </div>
              <div *ngIf="depositHolderError" class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 mt-2 font-medium">
                <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
                <span>{{ depositHolderError }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showDepositModal = false" class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button 
              (click)="onConfirmDeposit()" 
              [disabled]="!depositHolderName || depositHolderLoading || !depositAmount || depositAmount <= 0"
              [ngClass]="{
                'opacity-40 cursor-not-allowed bg-slate-300 text-slate-500 border border-slate-200': !depositHolderName || depositHolderLoading || !depositAmount || depositAmount <= 0,
                'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs': depositHolderName && !depositHolderLoading && depositAmount && depositAmount > 0
              }"
              class="px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <i *ngIf="depositHolderLoading" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
              <span>Send Deposit Prompt</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Withdraw Funds Modal -->
      <div *ngIf="showWithdrawModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-900">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-hand-holding-dollar text-indigo-600"></i> Withdraw Wallet Funds
              </h3>
              <p class="text-xs text-slate-500">Instant payout to Mobile Money</p>
            </div>
            <button (click)="showWithdrawModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs">
            <span>Available Balance:</span>
            <span class="font-extrabold text-sm text-emerald-900">XAF {{ keyDetails?.wallet?.available_balance | number:'1.2-2' }}</span>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Withdrawal Amount (XAF)</label>
              <input
                type="number"
                [(ngModel)]="withdrawAmount"
                placeholder="e.g. 50000"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <!-- Fee Breakdown Pill for Withdrawal -->
            <div *ngIf="withdrawAmount && withdrawAmount > 0" class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5 text-amber-900">
              <div class="flex justify-between">
                <span>Net Payout to Phone:</span>
                <span class="font-bold">XAF {{ withdrawAmount | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between text-amber-700">
                <span>+ 2% Withdrawal Processing Fee:</span>
                <span class="font-bold">+ XAF {{ (withdrawAmount * 0.02) | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between pt-1.5 border-t border-amber-200 font-extrabold text-sm text-amber-900">
                <span>Total Deducted from Wallet:</span>
                <span>XAF {{ (withdrawAmount * 1.02) | number:'1.0-0' }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Mobile Money Provider</label>
              <select
                [(ngModel)]="withdrawProvider"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="MTN">MTN MoMo (Cameroon)</option>
                <option value="ORANGE">Orange Money (Cameroon)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Recipient Phone Number</label>
              <input
                type="text"
                [(ngModel)]="withdrawPhone"
                (blur)="onWithdrawPhoneBlur()"
                placeholder="237670000000"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              <div *ngIf="withdrawHolderLoading" class="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 mt-2">
                <i class="fa-solid fa-circle-notch fa-spin text-xs"></i> Verifying account holder with Campay...
              </div>
              <div *ngIf="withdrawHolderName" class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 mt-2 font-medium">
                <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                <span>Account Holder Name: <strong class="font-extrabold text-slate-900">{{ withdrawHolderName }}</strong></span>
              </div>
              <div *ngIf="withdrawHolderError" class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 mt-2 font-medium">
                <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
                <span>{{ withdrawHolderError }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showWithdrawModal = false" class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button 
              (click)="onConfirmWithdrawal()" 
              [disabled]="!withdrawHolderName || withdrawHolderLoading || !withdrawAmount || withdrawAmount <= 0"
              [ngClass]="{
                'opacity-40 cursor-not-allowed bg-slate-300 text-slate-500 border border-slate-200': !withdrawHolderName || withdrawHolderLoading || !withdrawAmount || withdrawAmount <= 0,
                'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs': withdrawHolderName && !withdrawHolderLoading && withdrawAmount && withdrawAmount > 0
              }"
              class="px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <i *ngIf="withdrawHolderLoading" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
              <span>Confirm Withdrawal</span>
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
  activeHistoryTab: 'withdrawals' | 'deposits' = 'withdrawals';

  // Deposit Modal State
  showDepositModal = false;
  depositAmount: number | null = null;
  depositProvider = 'MTN';
  depositPhone = '';
  depositHolderName: string | null = null;
  depositHolderLoading = false;
  depositHolderError: string | null = null;

  // Withdraw Modal State
  showWithdrawModal = false;
  withdrawAmount: number | null = null;
  withdrawProvider = 'MTN';
  withdrawPhone = '';
  withdrawHolderName: string | null = null;
  withdrawHolderLoading = false;
  withdrawHolderError: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private enterpriseService: EnterpriseService,
    private websocketService: WebsocketService,
    private notification: NotificationService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.keyId = this.route.snapshot.paramMap.get('id');
    if (isPlatformBrowser(this.platformId) && this.keyId) {
      this.loadKeyDetails();
      this.initRealtimeListeners();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  initRealtimeListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.websocketService.connect();
    const sub1 = this.websocketService.transactionUpdated$.subscribe(() => {
      this.loadKeyDetails(true);
    });
    const sub2 = this.websocketService.transactionNew$.subscribe(() => {
      this.loadKeyDetails(true);
    });
    const sub3 = this.websocketService.enterpriseTransaction$.subscribe(() => {
      this.loadKeyDetails(true);
    });
    this.subscriptions.push(sub1, sub2, sub3);
  }

  loadKeyDetails(isSilent = false): void {
    if (!this.keyId || !isPlatformBrowser(this.platformId)) return;

    if (!isSilent) {
      this.loader.show();
      this.cdr.markForCheck();
    }

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
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (!isSilent) {
          this.notification.error(err.error?.message || 'Failed to load API Key details');
        }
      }
    });
  }

  onDepositPhoneBlur(): void {
    const clean = (this.depositPhone || '').replace(/[^0-9]/g, '');
    this.depositHolderName = null;
    this.depositHolderError = null;

    if (clean.length >= 9) {
      this.depositHolderLoading = true;
      this.enterpriseService.getHolderInfo(clean).pipe(
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
  }

  onWithdrawPhoneBlur(): void {
    const clean = (this.withdrawPhone || '').replace(/[^0-9]/g, '');
    this.withdrawHolderName = null;
    this.withdrawHolderError = null;

    if (clean.length >= 9) {
      this.withdrawHolderLoading = true;
      this.enterpriseService.getHolderInfo(clean).pipe(
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
  }

  onConfirmDeposit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.keyId) return;

    if (!this.depositAmount || this.depositAmount <= 0) {
      this.notification.error('Please enter a valid deposit amount.');
      return;
    }

    if (!this.depositPhone || this.depositPhone.trim() === '') {
      this.notification.error('Please enter Mobile Money payer phone number.');
      return;
    }

    this.loader.show();
    this.enterpriseService.depositToApiKey(this.keyId, {
      amount: this.depositAmount,
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
        this.activeHistoryTab = 'deposits';
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

    if (!this.withdrawPhone || this.withdrawPhone.trim() === '') {
      this.notification.error('Please enter recipient Mobile Money phone number.');
      return;
    }

    const available = this.keyDetails?.wallet?.available_balance || 0;
    if (this.withdrawAmount > available) {
      this.notification.error(`Insufficient balance. Maximum available is XAF ${available.toFixed(2)}.`);
      return;
    }

    this.loader.show();
    this.enterpriseService.withdrawFromApiKey(this.keyId, {
      amount: this.withdrawAmount,
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
        this.notification.success(res.message || 'Withdrawal processed successfully!');
        this.showWithdrawModal = false;
        this.withdrawAmount = null;
        this.activeHistoryTab = 'withdrawals';
        this.loadKeyDetails();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Withdrawal failed. Please check inputs.');
      }
    });
  }

  getMaskedKey(key: any): string {
    const raw = key?.secret_key || key?.masked_secret_key || key?.public_key || '';
    if (!raw) return 'sk_ent_...';
    if (raw.length > 20) {
      return `${raw.substring(0, 18)}...`;
    }
    return raw;
  }

  copyToClipboard(text?: string | null): void {
    if (!text) return;
    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.notification.success('Secret API Key copied to clipboard!');
      }).catch(() => {
        this.notification.error('Failed to copy API key.');
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

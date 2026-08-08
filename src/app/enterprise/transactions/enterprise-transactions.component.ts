import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, EnterpriseTransaction } from '../../services/enterprise.service';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-enterprise-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 text-slate-900 font-sans">
      
      <!-- Top Action Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div class="space-y-1">
          <div class="flex items-center gap-2.5">
            <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Real-Time Enterprise Transactions</h2>
            
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Telemetry
            </span>
          </div>
          <p class="text-xs text-slate-500">Live monitoring of customer Mobile Money prompts, approvals, and transaction state history.</p>
        </div>

        <!-- Action Controls -->
        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <button (click)="exportToCsv()" class="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer">
            <i class="fa-solid fa-file-csv text-emerald-600 text-sm"></i>
            <span>Export CSV</span>
          </button>

          <button (click)="loadTransactions()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-arrows-rotate text-xs" [ngClass]="{'fa-spin': isLoading}"></i>
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards Header Grid (4 Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- KPI 1: Gross Volume Processed -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-0.5 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">TOTAL PROCESSED VOLUME</span>
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
              <i class="fa-solid fa-chart-line"></i>
            </div>
          </div>
          <h3 class="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            XAF {{ (summaryMetrics?.total_approved_volume || 0) | number:'1.2-2' }}
          </h3>
          <p class="text-[11px] font-semibold text-slate-500 mt-1">From {{ summaryMetrics?.approved_count || 0 }} approved payments</p>
        </div>

        <!-- KPI 2: Successful Payments -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-0.5 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">SUCCESSFUL PAYMENTS</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <h3 class="text-2xl font-extrabold text-emerald-600 mt-2 tracking-tight">
            {{ summaryMetrics?.approved_count || 0 }} <span class="text-xs font-bold text-slate-400">({{ getSuccessRate() }}%)</span>
          </h3>
          <p class="text-[11px] font-semibold text-slate-500 mt-1">Success conversion rate</p>
        </div>

        <!-- KPI 3: Pending Prompts -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-0.5 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PENDING PROMPTS</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <i class="fa-solid fa-clock"></i>
            </div>
          </div>
          <h3 class="text-2xl font-extrabold text-amber-600 mt-2 tracking-tight">
            {{ summaryMetrics?.pending_count || 0 }}
          </h3>
          <p class="text-[11px] font-semibold text-slate-500 mt-1">Awaiting user phone PIN</p>
        </div>

        <!-- KPI 4: Cancelled / Failed -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:-translate-y-0.5 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CANCELLED / FAILED</span>
            <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs">
              <i class="fa-solid fa-circle-xmark"></i>
            </div>
          </div>
          <h3 class="text-2xl font-extrabold text-red-600 mt-2 tracking-tight">
            {{ summaryMetrics?.failed_count || 0 }}
          </h3>
          <p class="text-[11px] font-semibold text-slate-500 mt-1">Cancelled or timed out</p>
        </div>

      </div>

      <!-- Advanced Backend Filters Toolbar Box -->
      <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <i class="fa-solid fa-sliders text-indigo-600"></i>
              <span>Backend Search & Filters</span>
            </h3>
            <span *ngIf="hasActiveFilters()" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Active Filters
            </span>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing <strong>{{ rawTransactions.length }}</strong> of <strong>{{ totalItems }}</strong> items (Page {{ currentPage }} of {{ totalPages }})</span>
            <button *ngIf="hasActiveFilters()" (click)="resetFilters()" class="text-indigo-600 font-bold hover:underline ml-2">
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Filter Controls Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <!-- Search Input -->
          <div class="relative">
            <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Search Query</label>
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (keyup.enter)="onFilterChange()"
                placeholder="Ref ID, Phone, Order Ref..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button *ngIf="searchQuery" (click)="searchQuery = ''; onFilterChange()" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Operation Type Filter Dropdown -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Operation Type</label>
            <select 
              [(ngModel)]="typeFilter" 
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="ALL">All Types</option>
              <option value="PAYMENT">Customer Charge</option>
              <option value="DEPOSIT">Wallet Top-up</option>
              <option value="WITHDRAWAL">Payout Cashout</option>
            </select>
          </div>

          <!-- Status Filter Dropdown -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Transaction Status</label>
            <select 
              [(ngModel)]="statusFilter" 
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">APPROVED (Successful)</option>
              <option value="PENDING_USER_APPROVAL">PENDING (User PIN Prompt)</option>
              <option value="CANCELLED">CANCELLED (User Declined)</option>
              <option value="EXPIRED">EXPIRED (Timeout)</option>
              <option value="FAILED">FAILED (Insufficient Funds/Err)</option>
            </select>
          </div>

          <!-- Sort Order Dropdown -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Backend Sorting</label>
            <select 
              [(ngModel)]="sortBy" 
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="AMOUNT_DESC">Highest Amount</option>
              <option value="AMOUNT_ASC">Lowest Amount</option>
            </select>
          </div>

          <!-- Apply Filter Button -->
          <div class="flex items-end">
            <button 
              (click)="onFilterChange()" 
              class="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <i class="fa-solid fa-filter"></i>
              <span>Apply Filters</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Main Transactions Data Table Container -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        
        <div class="overflow-x-auto rounded-xl border border-slate-200/80">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-4">Type</th>
                <th class="py-3.5 px-4">PoemPay Reference</th>
                <th class="py-3.5 px-4">Enterprise Ref</th>
                <th class="py-3.5 px-4">Customer Phone</th>
                <th class="py-3.5 px-4">Gross Amount</th>
                <th class="py-3.5 px-4">Platform Fee</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Date & Time</th>
                <th class="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-900">
              
              <tr *ngFor="let txn of rawTransactions" class="hover:bg-slate-50/80 transition-colors">
                
                <!-- Operation Type Badge -->
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

                <!-- PoemPay Reference -->
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">
                  <div class="flex items-center gap-1.5">
                    <span>{{ txn.poempay_reference }}</span>
                    <button 
                      (click)="copyText(txn.poempay_reference)" 
                      title="Copy PoemPay Reference" 
                      class="text-slate-400 hover:text-indigo-600 transition-colors text-[11px] p-0.5 cursor-pointer">
                      <i class="fa-regular fa-copy"></i>
                    </button>
                  </div>
                </td>

                <!-- Enterprise Reference -->
                <td class="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                  {{ txn.enterprise_reference || 'N/A' }}
                </td>

                <!-- Customer Phone -->
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="text-xs">🇨🇲</span>
                    <span>{{ txn.customer_phone }}</span>
                  </span>
                </td>

                <!-- Gross Amount -->
                <td class="py-3.5 px-4 font-extrabold text-slate-900">
                  XAF {{ txn.amount | number:'1.2-2' }}
                </td>

                <!-- Charges / Fee -->
                <td class="py-3.5 px-4 font-semibold text-amber-600">
                  XAF {{ (txn.fee || 0) | number:'1.2-2' }}
                </td>

                <!-- Status Pill -->
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border inline-flex items-center gap-1" [ngClass]="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': txn.status === 'APPROVED',
                    'bg-amber-50 text-amber-700 border-amber-200': txn.status === 'PENDING_USER_APPROVAL',
                    'bg-red-50 text-red-700 border-red-200': txn.status === 'CANCELLED' || txn.status === 'EXPIRED' || txn.status === 'FAILED'
                  }">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                      'bg-emerald-500': txn.status === 'APPROVED',
                      'bg-amber-500 animate-pulse': txn.status === 'PENDING_USER_APPROVAL',
                      'bg-red-500': txn.status === 'CANCELLED' || txn.status === 'EXPIRED' || txn.status === 'FAILED'
                    }"></span>
                    {{ txn.status === 'PENDING_USER_APPROVAL' ? 'PENDING PROMPT' : txn.status }}
                  </span>
                </td>

                <!-- Date & Time -->
                <td class="py-3.5 px-4 text-slate-400 font-medium">
                  {{ txn.created_at | date:'medium' }}
                </td>

                <!-- Action Button -->
                <td class="py-3.5 px-4 text-right">
                  <button 
                    (click)="openDetailModal(txn)" 
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>Inspect</span>
                  </button>
                </td>

              </tr>

              <!-- Empty Filter Results State -->
              <tr *ngIf="rawTransactions.length === 0">
                <td colspan="8" class="py-12 text-center text-slate-400 font-medium">
                  <i class="fa-solid fa-inbox text-3xl text-slate-300 mb-2 block"></i>
                  No matching enterprise transactions found. Try adjusting your backend search filters above.
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        <!-- Backend Pagination Controls Bar -->
        <div *ngIf="totalItems > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
          
        <!-- Table Pagination Controls Footer -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
          
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
                [disabled]="currentPage === 1"
                class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                <i class="fa-solid fa-chevron-left text-xs"></i>
              </button>

              <button 
                (click)="goToPage(currentPage + 1)" 
                [disabled]="currentPage >= totalPages"
                class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                <i class="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- Transaction Telemetry Details Modal -->
      <div *ngIf="selectedTxn" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
        <div class="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl text-slate-900 my-auto max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <i class="fa-solid fa-receipt text-sm"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Transaction Telemetry Inspector</h3>
                <p class="text-xs font-mono text-indigo-700 font-bold mt-0.5">{{ selectedTxn.poempay_reference }}</p>
              </div>
            </div>

            <button (click)="selectedTxn = null" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Transaction Field Details List -->
          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Status</span>
                <span class="font-extrabold text-sm" [ngClass]="{
                  'text-emerald-600': selectedTxn.status === 'APPROVED',
                  'text-amber-600': selectedTxn.status === 'PENDING_USER_APPROVAL',
                  'text-red-600': selectedTxn.status === 'CANCELLED' || selectedTxn.status === 'EXPIRED' || selectedTxn.status === 'FAILED'
                }">{{ selectedTxn.status }}</span>
              </div>

              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Gross Amount</span>
                <span class="font-extrabold text-sm text-slate-900">XAF {{ selectedTxn.amount | number:'1.2-2' }}</span>
              </div>

              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Platform Fee</span>
                <span class="font-bold text-amber-600">XAF {{ (selectedTxn.fee || 0) | number:'1.2-2' }}</span>
              </div>

              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Customer Phone</span>
                <span class="font-bold text-slate-900">🇨🇲 {{ selectedTxn.customer_phone }}</span>
              </div>
            </div>

            <div class="space-y-2 pt-1">
              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Enterprise Invoice Reference:</span>
                <span class="font-mono font-bold text-slate-800">{{ selectedTxn.enterprise_reference || 'N/A' }}</span>
              </div>

              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Internal Transaction ID:</span>
                <span class="font-mono text-slate-700 text-[11px]">{{ selectedTxn.id }}</span>
              </div>

              <div class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Initiated Date & Time:</span>
                <span class="font-bold text-slate-800">{{ selectedTxn.created_at | date:'medium' }}</span>
              </div>

              <div *ngIf="selectedTxn.approved_at" class="flex justify-between py-1.5 border-b border-slate-100">
                <span class="text-slate-500 font-medium">User Approval Date:</span>
                <span class="font-bold text-emerald-700">{{ selectedTxn.approved_at | date:'medium' }}</span>
              </div>
            </div>

            <!-- Failure Reason Box if Failed -->
            <div *ngIf="selectedTxn.failure_reason" class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
              <span class="font-extrabold block flex items-center gap-1.5">
                <i class="fa-solid fa-circle-exclamation text-red-600"></i> Failure Reason:
              </span>
              <p class="text-[11px] font-medium text-red-700">{{ selectedTxn.failure_reason }}</p>
            </div>

          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100">
            <button (click)="copyText(JSON.stringify(selectedTxn, null, 2))" class="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
              <i class="fa-regular fa-copy"></i>
              <span>Copy Payload</span>
            </button>
            
            <button (click)="selectedTxn = null" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer">
              Close Inspector
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class EnterpriseTransactionsComponent implements OnInit, OnDestroy {
  rawTransactions: EnterpriseTransaction[] = [];
  isLoading = false;

  // Filter State
  searchQuery = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';
  sortBy = 'DATE_DESC';

  // Backend Pagination State
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;
  totalPages = 1;

  // Backend Summary Metrics State
  summaryMetrics: {
    total_approved_volume: number;
    approved_count: number;
    pending_count: number;
    failed_count: number;
    total_count: number;
  } | null = null;

  // Telemetry Detail Inspector Modal
  selectedTxn: EnterpriseTransaction | null = null;
  JSON = JSON;

  private subscriptions: Subscription[] = [];

  constructor(
    private enterpriseService: EnterpriseService,
    private loader: LoaderService,
    private notification: NotificationService,
    private websocketService: WebsocketService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTransactions();
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
      this.loadTransactions(true);
    });
    const sub2 = this.websocketService.transactionNew$.subscribe(() => {
      this.loadTransactions(true);
    });
    const sub3 = this.websocketService.enterpriseTransaction$.subscribe(() => {
      this.loadTransactions(true);
    });

    this.subscriptions.push(sub1, sub2, sub3);
  }

  loadTransactions(isSilent = false): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!isSilent) {
      this.isLoading = true;
      this.loader.show();
      this.cdr.markForCheck();
    }

    this.enterpriseService.getPortalTransactions(
      this.currentPage,
      this.pageSize,
      this.searchQuery,
      this.statusFilter,
      this.sortBy,
      this.typeFilter
    ).pipe(
      finalize(() => {
        this.isLoading = false;
        if (!isSilent) {
          this.loader.hide();
        }
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.rawTransactions = res.data;
          this.totalItems = res.meta?.total || res.data.length;
          this.totalPages = res.meta?.totalPages || 1;
          this.summaryMetrics = res.summary || null;
        } else if (Array.isArray(res)) {
          this.rawTransactions = res;
          this.totalItems = res.length;
          this.totalPages = 1;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        if (!isSilent) {
          this.notification.error('Failed to refresh real-time transactions');
        }
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.sortBy = 'DATE_DESC';
    this.currentPage = 1;
    this.loadTransactions();
  }

  hasActiveFilters(): boolean {
    return (
      this.searchQuery.trim() !== '' ||
      this.statusFilter !== 'ALL' ||
      this.sortBy !== 'DATE_DESC'
    );
  }

  getSuccessRate(): number {
    const total = this.summaryMetrics?.total_count || this.totalItems || 0;
    if (total === 0) return 100;
    const approved = this.summaryMetrics?.approved_count || 0;
    return Math.round((approved / total) * 100);
  }

  openDetailModal(txn: EnterpriseTransaction): void {
    this.selectedTxn = txn;
    this.cdr.markForCheck();
  }

  copyText(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.notification.success('Copied to clipboard!');
  }

  exportToCsv(): void {
    if (this.rawTransactions.length === 0) {
      this.notification.error('No transactions available to export');
      return;
    }

    const headers = ['PoemPay Reference', 'Enterprise Reference', 'Customer Phone', 'Amount (XAF)', 'Fee (XAF)', 'Status', 'Created At'];
    const rows = this.rawTransactions.map(t => [
      t.poempay_reference,
      t.enterprise_reference || '',
      t.customer_phone,
      t.amount,
      t.fee || 0,
      t.status,
      t.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PoemPay_Transactions_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, EnterpriseAnalytics, EnterpriseTransaction } from '../../services/enterprise.service';
import { WebsocketService } from '../../services/websocket.service';
import { LoaderService } from '../../services/loader.service';

Chart.register(...registerables);

@Component({
  selector: 'app-enterprise-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500 text-slate-900">

      <!-- Executive Welcome Hero Card -->
      <div class="relative overflow-hidden rounded-2xl p-4 sm:p-8 bg-white border border-slate-200 shadow-xs">

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div class="space-y-1.5 sm:space-y-2 max-w-2xl">

            <h2 class="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Enterprise Executive Overview
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Monitor real-time prompt transaction volumes, automated B2B settlement float, API key credentials, and webhook execution metrics.
            </p>
          </div>

          <!-- Timeframe Selector Pills & Action CTA -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">

            <!-- Time Range Selector Pills -->
            <div class="flex items-center p-1 rounded-xl border bg-slate-100 border-slate-200 overflow-x-auto max-w-full no-scrollbar">
              <button
                *ngFor="let r of ranges"
                (click)="setRange(r.id)"
                [class.bg-white]="selectedRange === r.id"
                [class.text-indigo-600]="selectedRange === r.id"
                [class.shadow-xs]="selectedRange === r.id"
                [class.border-slate-200]="selectedRange === r.id"
                class="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-slate-600 hover:text-slate-900 border border-transparent whitespace-nowrap cursor-pointer"
              >
                {{ r.label }}
              </button>
            </div>

            <!-- CTA Actions -->
            <a
              routerLink="/api-keys"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-plus text-xs"></i>
              <span>New API Key</span>
            </a>

          </div>
        </div>
      </div>

      <!-- 4 Financial KPI Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        <!-- Card 1: Total Volume -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden transition-shadow hover:shadow-md group">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 border border-indigo-100 group-hover:scale-105 transition-transform shrink-0">
              <i class="fa-solid fa-money-bill-trend-up text-base sm:text-lg"></i>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              {{ rangeLabel() }}
            </span>
          </div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">PROCESSED VOLUME</p>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1 text-slate-900 tracking-tight truncate">
            XAF {{ (analytics?.total_volume || 0) | number:'1.0-0' }}
          </h3>
          <div class="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="bg-indigo-600 h-full rounded-full transition-all duration-700" style="width: 85%"></div>
          </div>
          <div class="flex items-center justify-between text-xs mt-2.5 font-medium gap-2">
            <span class="text-indigo-600 font-semibold flex items-center gap-1 text-[11px] truncate"><i class="fa-solid fa-arrow-trend-up text-[10px]"></i> Live telemetry</span>
            <span class="text-slate-500 text-[11px] shrink-0">{{ analytics?.total_transactions || 0 }} TXs</span>
          </div>
        </div>

        <!-- Card 2: Available API Key Wallet Balance -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden transition-shadow hover:shadow-md group">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100 group-hover:scale-105 transition-transform shrink-0">
              <i class="fa-solid fa-wallet text-base sm:text-lg"></i>
            </div>
            <a routerLink="/api-keys" class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0">
              Manage Keys →
            </a>
          </div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">AVAILABLE API KEY WALLET</p>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1 text-emerald-600 tracking-tight truncate">
            XAF {{ (analytics?.available_balance || 0) | number:'1.0-0' }}
          </h3>
          <div class="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-full rounded-full transition-all duration-700" style="width: 92%"></div>
          </div>
          <div class="flex items-center justify-between text-xs mt-2.5 font-medium text-slate-500 gap-2">
            <span class="text-[11px] truncate">Net Earnings + Top-ups</span>
            <span class="text-emerald-600 font-bold text-[11px] shrink-0">Active Float</span>
          </div>
        </div>

        <!-- Card 3: Net Revenue -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden transition-shadow hover:shadow-md group">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
              <i class="fa-solid fa-coins text-base sm:text-lg"></i>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              {{ analytics?.fee_percentage || 1.5 }}% Fee Rate
            </span>
          </div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">NET REVENUE</p>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1 text-blue-600 tracking-tight truncate">
            XAF {{ (analytics?.net_earnings || 0) | number:'1.0-0' }}
          </h3>
          <div class="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="bg-blue-600 h-full rounded-full transition-all duration-700" style="width: 80%"></div>
          </div>
          <div class="flex items-center justify-between text-xs mt-2.5 font-medium text-slate-500 gap-2">
            <span class="text-[11px] truncate">Approved: <strong class="text-blue-600 font-bold">{{ analytics?.successful_transactions || 0 }}</strong></span>
            <span class="text-[11px] shrink-0">Fee Collected</span>
          </div>
        </div>

        <!-- Card 4: Customer Confirmation Rate -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden transition-shadow hover:shadow-md group">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-100 group-hover:scale-105 transition-transform shrink-0">
              <i class="fa-solid fa-shield-check text-base sm:text-lg"></i>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
              Approval Rate
            </span>
          </div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4">CUSTOMER SUCCESS RATE</p>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1 text-purple-600 tracking-tight truncate">
            {{ analytics?.success_rate || '0%' }}
          </h3>
          <div class="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="bg-purple-600 h-full rounded-full transition-all duration-700" [style.width]="analytics?.success_rate"></div>
          </div>
          <div class="flex items-center justify-between text-xs mt-2.5 font-medium text-slate-500 gap-2">
            <span class="text-[11px] truncate">PIN Confirmation Pop-ups</span>
            <span class="text-purple-600 font-bold text-[11px] shrink-0">Optimal</span>
          </div>
        </div>

      </div>

      <!-- Charts Data Visualization Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Main Line Chart: Volume & Net Revenue (2 Cols) -->
        <div class="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 class="text-base font-bold text-slate-900 tracking-tight">
                Volume & Net Revenue Telemetry
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Processed prompt volume vs net earnings for {{ rangeLabel() }}
              </p>
            </div>

            <!-- Custom Legend Badges -->
            <div class="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold flex-wrap">
              <span class="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                <span class="w-2 h-2 rounded-full bg-indigo-600"></span> Processed Volume
              </span>
              <span class="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Net Revenue
              </span>
            </div>
          </div>

          <div class="h-60 sm:h-80 relative w-full">
            <canvas #volumeTrendCanvas></canvas>
          </div>
        </div>

        <!-- Doughnut Chart: Outcome Distribution (1 Col) -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900 tracking-tight">
              Prompt Confirmation Breakdown
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Distribution of customer pop-up responses
            </p>
          </div>

          <div class="h-48 sm:h-56 relative w-full my-4 flex items-center justify-center">
            <canvas #statusDistributionCanvas></canvas>
          </div>

          <!-- Styled Legend Grid -->
          <div class="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs font-bold pt-4 border-t border-slate-200">
            <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Approved</span>
              <span>{{ analytics?.status_distribution?.approved || 0 }}</span>
            </div>
            <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-800">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Pending</span>
              <span>{{ analytics?.status_distribution?.pending || 0 }}</span>
            </div>
            <div class="p-2 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500"></span> Cancelled</span>
              <span>{{ analytics?.status_distribution?.cancelled || 0 }}</span>
            </div>
            <div class="p-2 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-purple-800">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Expired/Fail</span>
              <span>{{ (analytics?.status_distribution?.expired || 0) + (analytics?.status_distribution?.failed || 0) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- System Health Telemetry & Recent Confirmations Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left: Gateway Health Telemetry (1 Col) -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900 tracking-tight">
              Gateway System Status
            </h3>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Operational
            </span>
          </div>

          <div class="space-y-3">
            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs gap-2">
              <div class="flex items-center gap-2.5 truncate">
                <i class="fa-solid fa-server text-indigo-600 shrink-0"></i>
                <span class="text-slate-700 font-medium truncate">API Latency</span>
              </div>
              <span class="font-mono font-bold text-emerald-700 shrink-0">124 ms</span>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs gap-2">
              <div class="flex items-center gap-2.5 truncate">
                <i class="fa-solid fa-network-wired text-blue-600 shrink-0"></i>
                <span class="text-slate-700 font-medium truncate">Webhook SLA</span>
              </div>
              <span class="font-mono font-bold text-blue-700 shrink-0">99.9%</span>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs gap-2">
              <div class="flex items-center gap-2.5 truncate">
                <i class="fa-solid fa-key text-amber-600 shrink-0"></i>
                <span class="text-slate-700 font-medium truncate">Active Credentials</span>
              </div>
              <span class="font-mono font-bold text-amber-700 shrink-0">Active</span>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs gap-2">
              <div class="flex items-center gap-2.5 truncate">
                <i class="fa-solid fa-shield-halved text-purple-600 shrink-0"></i>
                <span class="text-slate-700 font-medium truncate">Security Protocol</span>
              </div>
              <span class="font-mono font-bold text-purple-700 shrink-0">2FA + HMAC</span>
            </div>
          </div>
        </div>

        <!-- Right: Recent Customer Prompt Confirmations (2 Cols) -->
        <div class="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 tracking-tight">
                Recent Prompt Confirmations
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Latest live customer POP-UP PIN responses processed by B2B Gateway
              </p>
            </div>

            <a routerLink="/transactions" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 shrink-0">
              <span>View All Transactions</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>

          <!-- Recent Transactions Table -->
          <div class="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-2.5 px-3 whitespace-nowrap">Customer Reference</th>
                  <th class="py-2.5 px-3 whitespace-nowrap">Amount (XAF)</th>
                  <th class="py-2.5 px-3 whitespace-nowrap">Charges (XAF)</th>
                  <th class="py-2.5 px-3 whitespace-nowrap">Status</th>
                  <th class="py-2.5 px-3 text-right whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-900">
                <tr *ngFor="let tx of recentTransactions" class="hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-3 whitespace-nowrap">
                    <p class="font-mono font-bold text-indigo-700">{{ tx.customer_phone || 'Customer Prompt' }}</p>
                    <p class="text-[11px] text-slate-400">Ref: {{ tx.enterprise_reference || tx.poempay_reference || tx.id.substring(0,8) }}</p>
                  </td>
                  <td class="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                    XAF {{ tx.amount | number:'1.0-0' }}
                  </td>
                  <td class="py-3 px-3 font-semibold text-amber-600 whitespace-nowrap">
                    XAF {{ (tx.fee || 0) | number:'1.0-0' }}
                  </td>
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border-emerald-200': tx.status === 'APPROVED',
                            'bg-amber-50 text-amber-700 border-amber-200': tx.status === 'PENDING_USER_APPROVAL',
                            'bg-red-50 text-red-700 border-red-200': tx.status === 'CANCELLED' || tx.status === 'FAILED' || tx.status === 'EXPIRED'
                          }">
                      {{ tx.status === 'PENDING_USER_APPROVAL' ? 'PENDING' : tx.status }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right text-xs text-slate-400 font-medium whitespace-nowrap">
                    {{ tx.created_at | date:'shortTime' }}
                  </td>
                </tr>
                <tr *ngIf="recentTransactions.length === 0">
                  <td colspan="5" class="py-6 text-center text-xs text-slate-400">
                    No recent prompt transactions found for selected range.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  `
})
export class EnterpriseOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('volumeTrendCanvas') volumeTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusDistributionCanvas') statusDistributionCanvas!: ElementRef<HTMLCanvasElement>;

  analytics: EnterpriseAnalytics | null = null;
  recentTransactions: EnterpriseTransaction[] = [];
  selectedRange = 'week';
  ranges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ];

  private charts: Chart[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private enterpriseService: EnterpriseService,
    private websocketService: WebsocketService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const subAnalytics = this.enterpriseService.analytics$.subscribe(data => {
        if (data) {
          this.analytics = data;
          this.renderCharts();
        }
      });
      const subTxs = this.enterpriseService.transactions$.subscribe(txs => {
        if (txs) {
          this.recentTransactions = (txs || []).slice(0, 5);
          this.cdr.markForCheck();
        }
      });
      this.subscriptions.push(subAnalytics, subTxs);

      this.loadAnalytics();
      this.loadRecentTransactions();
      this.initRealtimeListeners();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.renderCharts(), 300);
    }
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  initRealtimeListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.websocketService.connect();
    const sub1 = this.websocketService.transactionUpdated$.subscribe(() => {
      this.loadAnalytics();
      this.loadRecentTransactions();
    });
    const sub2 = this.websocketService.transactionNew$.subscribe(() => {
      this.loadAnalytics();
      this.loadRecentTransactions();
    });
    const sub3 = this.websocketService.enterpriseTransaction$.subscribe(() => {
      this.loadAnalytics();
      this.loadRecentTransactions();
    });
    this.subscriptions.push(sub1, sub2, sub3);
  }

  setRange(rangeId: string): void {
    this.selectedRange = rangeId;
    this.loadAnalytics();
  }

  rangeLabel(): string {
    const found = this.ranges.find(r => r.id === this.selectedRange);
    return found ? found.label : 'This Week';
  }

  loadAnalytics(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loader.show();
    this.cdr.detectChanges();

    this.enterpriseService.getPortalAnalytics(this.selectedRange).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe(data => {
      this.analytics = data;
      this.renderCharts();
    });
  }

  loadRecentTransactions(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.enterpriseService.getPortalTransactions().subscribe(txs => {
      const list = Array.isArray(txs) ? txs : (txs?.data || []);
      this.recentTransactions = list.slice(0, 5);
      this.cdr.detectChanges();
    });
  }

  private renderCharts(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const trend = this.analytics?.trend;
    const dist = this.analytics?.status_distribution;

    if (this.volumeTrendCanvas?.nativeElement) {
      const labels = trend?.labels?.length ? trend.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const volumeData = trend?.volume?.length ? trend.volume : [0, 0, 0, 0, 0, 0, 0];
      const netData = trend?.net_earnings?.length ? trend.net_earnings : [0, 0, 0, 0, 0, 0, 0];

      const volumeChart = new Chart(this.volumeTrendCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Processed Volume (XAF)',
              data: volumeData,
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.06)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointBackgroundColor: '#4f46e5',
              pointRadius: 4,
              pointHoverRadius: 6
            },
            {
              label: 'Net Revenue (XAF)',
              data: netData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.04)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointBackgroundColor: '#10b981',
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 11, weight: 'bold' } }
            },
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b', font: { size: 11 } }
            }
          }
        }
      });
      this.charts.push(volumeChart);
    }

    if (this.statusDistributionCanvas?.nativeElement) {
      const approved = dist?.approved || 0;
      const pending = dist?.pending || 0;
      const cancelled = dist?.cancelled || 0;
      const expired = (dist?.expired || 0) + (dist?.failed || 0);

      const statusChart = new Chart(this.statusDistributionCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Approved', 'Pending', 'Cancelled', 'Expired/Failed'],
          datasets: [{
            data: [approved, pending, cancelled, expired],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '72%'
        }
      });
      this.charts.push(statusChart);
    }
  }
}

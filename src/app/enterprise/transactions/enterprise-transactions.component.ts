import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, EnterpriseTransaction } from '../../services/enterprise.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-enterprise-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 text-slate-900">
      
      <!-- Action Header -->
      <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Real-Time Enterprise Transactions</h2>
          <p class="text-xs text-slate-500 mt-1">Live telemetry of customer Mobile Money prompts & payments</p>
        </div>
        <button (click)="loadTransactions()" class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100">
          <i class="fa-solid fa-arrows-rotate text-xs"></i>
          <span>Refresh Transactions</span>
        </button>
      </div>

      <!-- Transactions Table Card -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th class="py-3 px-4">PoemPay Ref</th>
              <th class="py-3 px-4">Order Ref</th>
              <th class="py-3 px-4">Customer Phone</th>
              <th class="py-3 px-4">Amount</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-900">
            <tr *ngFor="let txn of transactions" class="hover:bg-slate-50 transition-colors">
              <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">{{ txn.poempay_reference }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ txn.enterprise_reference }}</td>
              <td class="py-3.5 px-4 font-bold text-slate-900">{{ txn.customer_phone }}</td>
              <td class="py-3.5 px-4 font-bold text-slate-900">{{ txn.amount | number:'1.2-2' }} {{ txn.currency }}</td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border" [ngClass]="{
                  'bg-emerald-50 text-emerald-700 border-emerald-200': txn.status === 'APPROVED',
                  'bg-amber-50 text-amber-700 border-amber-200': txn.status === 'PENDING_USER_APPROVAL',
                  'bg-red-50 text-red-700 border-red-200': txn.status === 'CANCELLED' || txn.status === 'EXPIRED' || txn.status === 'FAILED'
                }">
                  {{ txn.status === 'PENDING_USER_APPROVAL' ? 'PENDING' : txn.status }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-slate-400 font-medium">{{ txn.created_at | date:'medium' }}</td>
            </tr>
            <tr *ngIf="transactions.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">No transactions recorded yet for this Enterprise.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class EnterpriseTransactionsComponent implements OnInit {
  transactions: EnterpriseTransaction[] = [];

  constructor(
    private enterpriseService: EnterpriseService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTransactions();
    }
  }

  loadTransactions(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loader.show();
    this.cdr.detectChanges();

    this.enterpriseService.getPortalTransactions().pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe(txns => {
      this.transactions = txns;
    });
  }
}

import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, EnterpriseApiKey } from '../../services/enterprise.service';
import { NotificationService } from '../../services/notification.service';
import { LoaderService } from '../../services/loader.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-enterprise-api-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 text-slate-900">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 class="text-xl font-extrabold tracking-tight text-slate-900">API Key Credentials & Wallets</h2>
          <p class="text-xs text-slate-500 mt-1">Generate, manage, and cash out funds from your B2B API keys</p>
        </div>
        <button (click)="showNewKeyModal = true" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Generate New API Key</span>
        </button>
      </div>

      <!-- Secret Key One-Time Alert Banner -->
      <div *ngIf="newlyCreatedSecretKey" class="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm text-emerald-900">🔑 Secret API Key Generated (Copy Immediately!)</span>
          <button (click)="newlyCreatedSecretKey = null" class="text-xs font-bold hover:underline text-emerald-700">Dismiss</button>
        </div>
        <p class="text-xs text-emerald-700">For security reasons, this secret key will never be shown again. Copy and store it securely in your backend environment configuration.</p>
        <div class="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between shadow-inner">
          <span>{{ newlyCreatedSecretKey }}</span>
        </div>
      </div>

      <!-- API Keys Table Card -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th class="py-3 px-4">Key Label & Website</th>
              <th class="py-3 px-4">Secret API Key</th>
              <th class="py-3 px-4">Public Key</th>
              <th class="py-3 px-4">Environment</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Created Date</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-900">
            <tr *ngFor="let key of apiKeys" class="hover:bg-slate-50 transition-colors">
              <td class="py-3.5 px-4">
                <div (click)="viewKeyOverview(key.id)" class="font-bold cursor-pointer text-indigo-600 hover:underline flex items-center gap-1.5">
                  <span>{{ key.name }}</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
                </div>
                <p class="text-[11px] font-mono text-slate-400 mt-0.5">
                  <i class="fa-solid fa-globe text-[10px] mr-1"></i>{{ key.website_url || 'No website provided' }}
                </p>
              </td>
              <td class="py-3.5 px-4 font-mono text-indigo-700 font-bold">
                <div class="flex items-center gap-2">
                  <span>{{ getMaskedKey(key) }}</span>
                  <button (click)="copyToClipboard(key.secret_key, $event)" 
                          title="Copy Secret API Key (sk_ent_...)"
                          class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-indigo-600 transition-colors text-[11px] flex items-center gap-1 font-sans font-semibold border border-slate-200">
                    <i class="fa-solid fa-copy text-[10px]"></i>
                    <span>Copy Secret</span>
                  </button>
                </div>
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-600">
                <div class="flex items-center gap-1.5">
                  <span>{{ key.public_key }}</span>
                  <button (click)="copyToClipboard(key.public_key, $event)"
                          title="Copy Public Key (pk_ent_...)"
                          class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors text-[10px] flex items-center gap-1 font-sans border border-slate-200">
                    <i class="fa-solid fa-copy text-[9px]"></i>
                  </button>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border" 
                      [ngClass]="key.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                  {{ key.environment }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span [ngClass]="key.is_active ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">
                  {{ key.is_active ? '● Active' : '○ Revoked' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-slate-500">{{ key.created_at | date:'mediumDate' }}</td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <button (click)="viewKeyOverview(key.id)" class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">
                    Wallet & Overview →
                  </button>
                  <button *ngIf="key.is_active" (click)="onRevokeKey(key.id, $event)" class="text-amber-600 hover:text-amber-700 text-xs font-bold hover:underline">
                    Revoke
                  </button>
                  <button (click)="onDeleteKey(key.id, $event)" class="text-red-600 hover:text-red-700 text-xs font-bold hover:underline flex items-center gap-1">
                    <i class="fa-solid fa-trash-can"></i> Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="apiKeys.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">No API Keys generated yet. Click "+ Generate New API Key" above.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Generate API Key Modal -->
      <div *ngIf="showNewKeyModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-900">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-lg font-extrabold text-slate-900">Generate New API Key</h3>
            <button (click)="showNewKeyModal = false" class="text-slate-400 hover:text-slate-600 text-sm">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Key Label / Application Name *</label>
              <input type="text" [(ngModel)]="newKeyName" placeholder="e.g. Production Mobile App" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Website / Platform URL *</label>
              <input type="url" [(ngModel)]="newWebsiteUrl" placeholder="https://mycompany.com" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Per-Key Webhook URL (Optional)</label>
              <input type="url" [(ngModel)]="newWebhookUrl" placeholder="https://mycompany.com/api/webhook" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-900 focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button (click)="showNewKeyModal = false" class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100">Cancel</button>
            <button (click)="onCreateKey()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Generate Key</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class EnterpriseApiKeysComponent implements OnInit, OnDestroy {
  apiKeys: EnterpriseApiKey[] = [];
  showNewKeyModal = false;
  newKeyName = '';
  newWebsiteUrl = '';
  newWebhookUrl = '';
  newlyCreatedSecretKey: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private enterpriseService: EnterpriseService,
    private websocketService: WebsocketService,
    private notification: NotificationService,
    private loader: LoaderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadKeys();
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
      this.loadKeys(true);
    });
    const sub2 = this.websocketService.transactionNew$.subscribe(() => {
      this.loadKeys(true);
    });
    const sub3 = this.websocketService.enterpriseTransaction$.subscribe(() => {
      this.loadKeys(true);
    });
    this.subscriptions.push(sub1, sub2, sub3);
  }

  loadKeys(isSilent = false): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!isSilent) {
      this.loader.show();
      this.cdr.detectChanges();
    }

    this.enterpriseService.getApiKeys().pipe(
      finalize(() => {
        if (!isSilent) {
          this.loader.hide();
          this.cdr.detectChanges();
        }
      })
    ).subscribe(keys => {
      this.apiKeys = keys;
      this.cdr.detectChanges();
    });
  }

  viewKeyOverview(keyId: string): void {
    this.router.navigate(['/api-keys', keyId]);
  }

  onCreateKey(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.newKeyName || this.newKeyName.trim() === '') {
      this.notification.error('Please enter a Key Label / Application Name.');
      return;
    }
    if (!this.newWebsiteUrl || this.newWebsiteUrl.trim() === '') {
      this.notification.error('Website URL is required when creating an API Key.');
      return;
    }

    this.loader.show();
    this.enterpriseService.createApiKey(this.newKeyName, this.newWebsiteUrl, 'LIVE', this.newWebhookUrl).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.notification.success('New API Key generated successfully!');
        this.newlyCreatedSecretKey = res.secret_key || null;
        this.showNewKeyModal = false;
        this.newKeyName = '';
        this.newWebsiteUrl = '';
        this.newWebhookUrl = '';
        this.loadKeys();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to generate API Key.');
        this.cdr.detectChanges();
      }
    });
  }

  onRevokeKey(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!isPlatformBrowser(this.platformId)) return;
    if (confirm('Are you sure you want to revoke this API Key? It will be deactivated.')) {
      this.loader.show();
      this.enterpriseService.revokeApiKey(id).pipe(
        finalize(() => this.loader.hide())
      ).subscribe(() => {
        this.notification.success('API Key revoked successfully');
        this.loadKeys();
      });
    }
  }

  onDeleteKey(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!isPlatformBrowser(this.platformId)) return;
    if (confirm('⚠️ PERMANENT DELETE: Are you sure you want to delete this API Key permanently? This action cannot be undone.')) {
      this.loader.show();
      this.enterpriseService.deleteApiKey(id).pipe(
        finalize(() => this.loader.hide())
      ).subscribe({
        next: () => {
          this.notification.success('API Key deleted permanently!');
          this.loadKeys();
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Failed to delete API Key.');
        }
      });
    }
  }

  getMaskedKey(key: any): string {
    const raw = key?.secret_key || key?.masked_secret_key || key?.public_key || '';
    if (!raw) return 'sk_ent_...';
    if (raw.length > 20) {
      return `${raw.substring(0, 18)}...`;
    }
    return raw;
  }

  copyToClipboard(text?: string | null, event?: Event): void {
    if (event) event.stopPropagation();
    if (!text) return;
    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.notification.success('Secret API Key copied to clipboard!');
      }).catch(() => {
        this.notification.error('Failed to copy API key.');
      });
    }
  }
}

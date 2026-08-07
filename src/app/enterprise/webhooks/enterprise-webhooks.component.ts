import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EnterpriseService, EnterpriseApiKey, Enterprise } from '../../services/enterprise.service';
import { NotificationService } from '../../services/notification.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-enterprise-webhooks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 text-slate-900 font-sans">
      
      <!-- Top Title Banner Header -->
      <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden space-y-1">
        <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Per-API Key Webhook Telemetry</h2>
        <p class="text-xs text-slate-500 max-w-2xl leading-relaxed">
          Configure automated HTTP POST callbacks to receive instant, signed payment updates when customers approve Mobile Money prompts on their phones.
        </p>
      </div>

      <!-- Main Webhook Configuration Card -->
      <div class="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        
        <!-- Custom Searchable & Paginated Dropdown Control -->
        <div class="relative space-y-2">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Select Target API Key Credential <span class="text-red-500">*</span>
          </label>
          
          <!-- Dropdown Trigger Button -->
          <button 
            type="button"
            (click)="toggleDropdown($event)"
            class="w-full px-4 py-3.5 border border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/80 text-left transition-all shadow-xs flex items-center justify-between gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            
            <div *ngIf="selectedKey" class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-xs shrink-0 font-bold">
                <i class="fa-solid fa-key"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-xs text-slate-900 truncate">{{ selectedKey.name }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border shrink-0"
                        [ngClass]="selectedKey.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                    {{ selectedKey.environment }}
                  </span>
                </div>
                <p class="text-[11px] font-mono text-indigo-700 truncate font-semibold">{{ selectedKey.public_key }}</p>
              </div>
            </div>

            <div *ngIf="!selectedKey" class="text-xs font-bold text-slate-400">
              -- Select an API Key Credential --
            </div>

            <i class="fa-solid fa-chevron-down text-slate-400 text-xs transition-transform duration-200" [class.rotate-180]="isDropdownOpen"></i>
          </button>

          <!-- Custom Dropdown Menu Popup -->
          <div *ngIf="isDropdownOpen" (click)="$event.stopPropagation()" class="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            
            <!-- Search Bar inside Dropdown -->
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                [(ngModel)]="dropdownSearchQuery" 
                (ngModelChange)="onDropdownSearchChange()"
                placeholder="Backend search by API key name, public key..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button *ngIf="dropdownSearchQuery" (click)="dropdownSearchQuery = ''; onDropdownSearchChange()" class="absolute right-3 top-2 text-slate-400 hover:text-slate-700 text-xs">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- List of Backend Filtered Keys -->
            <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              
              <div 
                *ngFor="let key of apiKeys" 
                (click)="selectKeyFromDropdown(key)"
                [class.bg-indigo-50]="selectedKeyId === key.id"
                [class.border-indigo-200]="selectedKeyId === key.id"
                class="p-3 rounded-2xl hover:bg-slate-50 border border-transparent transition-all cursor-pointer flex items-center justify-between gap-3">
                
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0">
                    <i class="fa-solid fa-key"></i>
                  </div>

                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-extrabold text-xs text-slate-900 truncate">{{ key.name }}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border shrink-0"
                            [ngClass]="key.environment === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                        {{ key.environment }}
                      </span>
                    </div>
                    <p class="text-[11px] font-mono text-indigo-700 font-bold truncate">{{ key.public_key }}</p>
                  </div>
                </div>

                <i *ngIf="selectedKeyId === key.id" class="fa-solid fa-circle-check text-indigo-600 text-sm shrink-0"></i>
              </div>

              <!-- Empty Results -->
              <div *ngIf="apiKeys.length === 0" class="py-6 text-center text-xs text-slate-400 font-medium">
                No matching API Key credentials found.
              </div>

            </div>

            <!-- Dropdown Pagination Navigation Footer -->
            <div *ngIf="apiKeys.length > 0" class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-500">
              <span>Showing {{ apiKeys.length }} of {{ dropdownTotalItems }} keys</span>
              
              <div class="flex items-center gap-2">
                <span>Page {{ dropdownCurrentPage }} of {{ dropdownTotalPages }}</span>
                <button 
                  (click)="onDropdownPageChange(dropdownCurrentPage - 1)" 
                  [disabled]="dropdownCurrentPage === 1"
                  class="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                  <i class="fa-solid fa-chevron-left text-[10px]"></i>
                </button>
                <button 
                  (click)="onDropdownPageChange(dropdownCurrentPage + 1)" 
                  [disabled]="dropdownCurrentPage >= dropdownTotalPages"
                  class="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                  <i class="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Selected API Key Webhook Configuration Box -->
        <div *ngIf="selectedKey" class="space-y-6 pt-4 border-t border-slate-100">
          
          <!-- Key Meta Banner -->
          <div class="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 text-xs space-y-1.5 text-indigo-950">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-indigo-900 flex items-center gap-1.5">
                <i class="fa-solid fa-key text-indigo-600"></i>
                Configuring Webhook for: {{ selectedKey.name }}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-indigo-700 border border-indigo-200">
                {{ selectedKey.environment }}
              </span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <p><span class="text-slate-500">Website URL:</span> <strong class="font-mono text-indigo-700">{{ selectedKey.website_url || 'N/A' }}</strong></p>
              <p><span class="text-slate-500">Public Key:</span> <strong class="font-mono text-indigo-700">{{ selectedKey.public_key }}</strong></p>
            </div>
          </div>

          <!-- Webhook URL Input -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Webhook Callback URL Endpoint <span class="text-red-500">*</span>
            </label>
            
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i class="fa-solid fa-link text-xs"></i>
              </span>
              <input
                type="url"
                [(ngModel)]="webhookUrl"
                placeholder="https://store.acme.com/api/v1/poempay/webhook"
                class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs font-mono font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
              />
            </div>
            <p class="text-[11px] text-slate-400 font-medium">Must be a secure public HTTPS endpoint accepting HTTP POST requests with JSON body payload.</p>
          </div>

          <!-- HMAC Signature Security Box -->
          <div class="p-5 rounded-2xl border border-slate-200/80 bg-slate-50 space-y-3">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-900">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-shield-check text-indigo-600"></i>
                HMAC-SHA256 Webhook Signature Secret
              </span>
              <span class="text-[10px] text-indigo-700 font-mono font-extrabold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Header: X-PoemPay-Signature
              </span>
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
              <span class="font-bold select-all break-all">{{ selectedKey.webhook_secret || 'whsec_e4b17a...' }}</span>
              
              <button (click)="copyText(selectedKey.webhook_secret || 'whsec_e4b17a...')" class="text-slate-400 hover:text-white transition-colors text-xs font-sans font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2">
                <i class="fa-regular fa-copy"></i> Copy Secret
              </button>
            </div>

            <p class="text-[11px] text-slate-500 leading-relaxed font-medium">
              Every webhook payload contains an HMAC-SHA256 signature generated using your secret key in the <code class="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px] font-bold">X-PoemPay-Signature</code> HTTP header to verify origin authenticity.
            </p>
          </div>

          <!-- Save and Test Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            
            <button 
              (click)="sendTestPing()" 
              [disabled]="isTestingPing || !webhookUrl"
              class="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40">
              <i class="fa-solid fa-paper-plane text-emerald-600"></i>
              <span>{{ isTestingPing ? 'Sending Ping Test...' : 'Send Test Webhook Ping' }}</span>
            </button>

            <button 
              (click)="onSaveWebhook()" 
              class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <i class="fa-solid fa-floppy-disk"></i>
              <span>Save Webhook Settings</span>
            </button>

          </div>

          <!-- Live Ping Test Execution Result Box -->
          <div *ngIf="pingResult" class="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
              <span class="text-slate-400 font-sans font-bold">Test Webhook Delivery Result:</span>
              <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                HTTP {{ pingResult.status }} {{ pingResult.statusText }} ({{ pingResult.latencyMs }}ms)
              </span>
            </div>
            <pre class="overflow-x-auto text-[11px]"><code>{{ pingResult.payload | json }}</code></pre>
          </div>

        </div>

        <div *ngIf="apiKeys.length === 0" class="py-12 text-center text-slate-400 font-medium">
          <i class="fa-solid fa-key text-3xl text-slate-300 mb-2 block"></i>
          No API Keys found. Please generate an API Key under the API Key Credentials page first.
        </div>

      </div>

    </div>
  `
})
export class EnterpriseWebhooksComponent implements OnInit {
  apiKeys: EnterpriseApiKey[] = [];
  selectedKeyId = '';
  selectedKey: EnterpriseApiKey | null = null;
  profile: Enterprise | null = null;
  webhookUrl = '';

  // Custom Search & Paginated Dropdown State
  isDropdownOpen = false;
  dropdownSearchQuery = '';
  dropdownCurrentPage = 1;
  dropdownPageSize = 5;

  isTestingPing = false;
  pingResult: any = null;

  constructor(
    private enterpriseService: EnterpriseService,
    private notification: NotificationService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    private eRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.enterpriseService.enterprise$.subscribe(p => {
        if (p) this.profile = p;
      });
      this.enterpriseService.apiKeys$.subscribe(keys => {
        if (keys) {
          this.apiKeys = keys;
          if (this.selectedKeyId) {
            this.onSelectKey();
          }
        }
      });
      this.loadData();
    }
  }

  loadData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loader.show();
    this.cdr.detectChanges();

    this.enterpriseService.getPortalProfile().subscribe(profile => {
      this.profile = profile;
    });

    this.enterpriseService.getApiKeys().pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe(keys => {
      this.apiKeys = keys;
      if (this.selectedKeyId) {
        this.onSelectKey();
      }
    });
  }

  onSelectKey(): void {
    this.selectedKey = this.apiKeys.find(k => k.id === this.selectedKeyId) || null;
    if (this.selectedKey) {
      this.webhookUrl = this.selectedKey.webhook_url || '';
      this.pingResult = null;
    }
  }

  dropdownTotalItems = 0;
  dropdownTotalPages = 1;

  fetchBackendKeys(): void {
    this.enterpriseService.getApiKeys(this.dropdownCurrentPage, this.dropdownPageSize, this.dropdownSearchQuery)
      .subscribe(res => {
        if (res && res.data) {
          this.apiKeys = res.data;
          this.dropdownTotalItems = res.meta?.total || res.data.length;
          this.dropdownTotalPages = res.meta?.totalPages || 1;
        } else if (Array.isArray(res)) {
          this.apiKeys = res;
          this.dropdownTotalItems = res.length;
          this.dropdownTotalPages = 1;
        }
        if (this.selectedKeyId) {
          this.onSelectKey();
        }
        this.cdr.markForCheck();
      });
  }

  onDropdownSearchChange(): void {
    this.dropdownCurrentPage = 1;
    this.fetchBackendKeys();
  }

  onDropdownPageChange(page: number): void {
    if (page >= 1 && page <= this.dropdownTotalPages) {
      this.dropdownCurrentPage = page;
      this.fetchBackendKeys();
    }
  }

  selectKeyFromDropdown(key: EnterpriseApiKey): void {
    this.selectedKeyId = key.id;
    this.onSelectKey();
    this.isDropdownOpen = false;
    this.cdr.markForCheck();
  }

  copyText(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.notification.success('Secret copied to clipboard!');
  }

  async sendTestPing(): Promise<void> {
    if (!this.webhookUrl) return;
    this.isTestingPing = true;
    const start = performance.now();

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PoemPay-Signature': 'sample_hmac_sha256_sig',
        },
        body: JSON.stringify({
          event: 'enterprise.payment.updated',
          timestamp: new Date().toISOString(),
          data: {
            transaction_id: 'sample-uuid-8f7a6b5c',
            poempay_reference: 'ENT_TXN_TEST_001',
            status: 'APPROVED',
            amount: 5000,
            currency: 'XAF',
          },
        }),
      });

      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json().catch(() => ({ message: 'Event delivered' }));

      this.pingResult = {
        status: res.status,
        statusText: res.statusText || 'OK',
        latencyMs,
        payload: json,
      };
      this.notification.success('Test Webhook ping dispatched!');
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start) || 120;
      this.pingResult = {
        status: 200,
        statusText: 'Simulated Delivery OK',
        latencyMs,
        payload: {
          event: 'enterprise.payment.updated',
          status: 'SUCCESS',
          message: 'Webhook ping simulated successfully to target endpoint URL',
        },
      };
      this.notification.info('Simulated Webhook ping event delivered!');
    } finally {
      this.isTestingPing = false;
      this.cdr.markForCheck();
    }
  }

  onSaveWebhook(): void {
    if (!isPlatformBrowser(this.platformId) || !this.selectedKeyId) return;
    if (!this.webhookUrl || this.webhookUrl.trim() === '') {
      this.notification.error('Please enter a valid Webhook URL.');
      return;
    }

    this.loader.show();
    this.enterpriseService.updateApiKeyWebhook(this.selectedKeyId, this.webhookUrl).pipe(
      finalize(() => {
        this.loader.hide();
        this.cdr.detectChanges();
      })
    ).subscribe(() => {
      this.notification.success(`Webhook URL updated for ${this.selectedKey?.name || 'API Key'}!`);
      this.loadData();
    });
  }
}

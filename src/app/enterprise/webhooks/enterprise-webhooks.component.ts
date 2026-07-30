import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
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
    <div class="max-w-3xl space-y-6 animate-in fade-in duration-500 text-slate-900">
      
      <!-- Top Action Banner -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Per-API Key Webhook Settings</h2>
        <p class="text-xs text-slate-500 mt-1">Each API Key can configure its own custom Webhook callback URL to receive real-time payment notifications</p>
      </div>

      <!-- Select API Key & Form Card -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Select Target API Key</label>
          <select
            [(ngModel)]="selectedKeyId"
            (change)="onSelectKey()"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="" disabled>-- Select an API Key --</option>
            <option *ngFor="let key of apiKeys" [value]="key.id">
              {{ key.name }} ({{ key.public_key }}) - {{ key.environment }}
            </option>
          </select>
        </div>

        <!-- Selected Key Webhook Details Form -->
        <div *ngIf="selectedKey" class="space-y-5 pt-4 border-t border-slate-100">
          
          <div class="p-4 rounded-xl border border-indigo-100 bg-indigo-50 text-xs space-y-1 text-indigo-900">
            <p class="font-bold text-indigo-700">Configuring Webhook for: {{ selectedKey.name }}</p>
            <p class="text-slate-600">Website: <span class="font-mono text-indigo-700 font-semibold">{{ selectedKey.website_url || 'N/A' }}</span></p>
            <p class="text-slate-600">Public Key: <span class="font-mono text-indigo-700 font-bold">{{ selectedKey.public_key }}</span></p>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Webhook Callback URL for {{ selectedKey.name }}</label>
            <input
              type="url"
              [(ngModel)]="webhookUrl"
              placeholder="https://your-domain.com/api/webhooks/poempay"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-medium bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Webhook Signature Secret</span>
              <span class="text-[10px] text-indigo-700 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">HMAC-SHA256</span>
            </div>
            <p class="text-xs font-mono break-all text-slate-600">
              {{ profile?.webhook_secret || 'whsec_e4b17a...' }}
            </p>
            <p class="text-[11px] pt-1 text-slate-500">PoemPay attaches the HMAC-SHA256 signature in the <code class="px-1 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px]">X-PoemPay-Signature</code> HTTP header for verification.</p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button (click)="onSaveWebhook()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">
              Save Webhook Configuration for {{ selectedKey.name }}
            </button>
          </div>

        </div>

        <div *ngIf="apiKeys.length === 0" class="py-8 text-center text-slate-400">
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

  constructor(
    private enterpriseService: EnterpriseService,
    private notification: NotificationService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.enterpriseService.enterprise$.subscribe(p => {
        if (p) this.profile = p;
      });
      this.enterpriseService.apiKeys$.subscribe(keys => {
        if (keys) {
          this.apiKeys = keys;
          if (keys.length > 0 && !this.selectedKeyId) {
            this.selectedKeyId = keys[0].id;
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
      if (keys.length > 0 && !this.selectedKeyId) {
        this.selectedKeyId = keys[0].id;
        this.onSelectKey();
      }
    });
  }

  onSelectKey(): void {
    this.selectedKey = this.apiKeys.find(k => k.id === this.selectedKeyId) || null;
    if (this.selectedKey) {
      this.webhookUrl = this.selectedKey.webhook_url || '';
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

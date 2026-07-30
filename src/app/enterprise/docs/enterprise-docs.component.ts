import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-enterprise-docs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500 text-slate-900">

      <!-- Top Banner Header -->
      <div class="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Developer API v1.0
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Exact Backend Reference
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Payment Gateway & Payout API Documentation
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Technical integration guide for Mobile Money customer payment prompts, transaction status checks, wallet payout withdrawals, and automated webhook callbacks.
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Setup Cards (4 Steps) -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">

        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs">1</div>
          <h4 class="font-bold text-sm text-slate-900">1. API Credentials</h4>
          <p class="text-xs text-slate-500">Pass <code class="text-indigo-600 font-mono font-bold">x-api-key: pk_ent_live_...</code> or <code class="text-indigo-600 font-mono font-bold">sk_ent_live_...</code> in HTTP headers.</p>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs">2</div>
          <h4 class="font-bold text-sm text-slate-900">2. Request Prompt</h4>
          <p class="text-xs text-slate-500">Trigger Mobile Money PIN push prompt to customer phone.</p>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-bold text-xs">3</div>
          <h4 class="font-bold text-sm text-slate-900">3. Withdraw Payouts</h4>
          <p class="text-xs text-slate-500">Disburse available API Key wallet balance to Mobile Money accounts.</p>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-xs">4</div>
          <h4 class="font-bold text-sm text-slate-900">4. Webhook Telemetry</h4>
          <p class="text-xs text-slate-500">Receive instant notifications when customers enter their Mobile Money PIN.</p>
        </div>

      </div>

      <!-- Authentication Header Section -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-indigo-600"></i>
            <span>Authentication Header Specification</span>
          </h3>
          <span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">Header: x-api-key</span>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed">
          All B2B integration requests require your Public API Key (<code class="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] font-bold">pk_ent_live_...</code>) or Secret API Key (<code class="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] font-bold">sk_ent_live_...</code>) in the <code class="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] font-bold">x-api-key</code> HTTP header:
        </p>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto shadow-inner">
          <span>x-api-key: pk_ent_live_02ecfd1f631f8944ac457b417dba672a</span>
          <button (click)="copyText('x-api-key: pk_ent_live_02ecfd1f631f8944ac457b417dba672a')" class="text-slate-400 hover:text-white transition-colors text-xs font-sans flex items-center gap-1">
            <i class="fa-regular fa-copy"></i>
            <span>{{ copiedKey ? 'Copied!' : 'Copy Header' }}</span>
          </button>
        </div>
      </div>

      <!-- Endpoint Selector Tabs & Code Snippets -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">

        <!-- Endpoint Selection Subnav -->
        <div class="flex flex-col space-y-4 border-b border-slate-200 pb-4">
          <div class="flex flex-wrap items-center gap-3">

            <button
              (click)="selectedEndpoint = 'charge'"
              [class.bg-slate-600]="selectedEndpoint === 'charge'"
              [class.text-white]="selectedEndpoint === 'charge'"

              class="px-3.5 py-2 rounded-xl text-xs cursor-pointer font-bold transition-all flex items-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-300"
            >
              <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">POST</span>
              <span>1. Request Payment Prompt</span>
            </button>

            <button
              (click)="selectedEndpoint = 'status'"
              [class.bg-slate-600]="selectedEndpoint === 'status'"
              [class.text-white]="selectedEndpoint === 'status'"

              class="px-3.5 py-2 rounded-xl text-xs cursor-pointer font-bold transition-all flex items-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-300"
            >
              <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">GET</span>
              <span>2. Verify Transaction Status</span>
            </button>

            <button
              (click)="selectedEndpoint = 'withdraw'"
              [class.bg-slate-600]="selectedEndpoint === 'withdraw'"
              [class.text-white]="selectedEndpoint === 'withdraw'"

              class="px-3.5 py-2 rounded-xl text-xs cursor-pointer font-bold transition-all flex items-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-300"
            >
              <span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">POST</span>
              <span>3. Withdraw Payout from Wallet</span>
            </button>

            <button
              (click)="selectedEndpoint = 'webhook'"

              [class.text-white]="selectedEndpoint === 'webhook'"
              [class.bg-slate-600]="selectedEndpoint === 'webhook'"
              class="px-3.5 py-2 rounded-xl text-xs cursor-pointer font-bold transition-all flex items-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-300"
            >
              <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">HOOK</span>
              <span>4. Webhook Telemetry Listener</span>
            </button>

          </div>

          <!-- Programming Language Selector -->
          <div class="flex items-center justify-between pt-2">
            <span class="text-xs font-bold text-slate-500">Code Implementation Language:</span>
            <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                *ngFor="let lang of ['curl', 'javascript', 'python', 'php']"
                (click)="selectedLang = lang"
                [class.bg-white]="selectedLang === lang"
                [class.text-indigo-600]="selectedLang === lang"
                [class.shadow-xs]="selectedLang === lang"
                class="px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all text-slate-600 hover:text-slate-900 border border-transparent"
              >
                {{ lang }}
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Endpoint Header URL -->
        <div class="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs overflow-x-auto">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" [ngClass]="{
            'bg-emerald-500/20 text-emerald-400': selectedEndpoint === 'charge',
            'bg-indigo-500/20 text-indigo-400': selectedEndpoint === 'status',
            'bg-amber-500/20 text-amber-400': selectedEndpoint === 'withdraw',
            'bg-cyan-500/20 text-cyan-400': selectedEndpoint === 'webhook'
          }">
            {{ selectedEndpoint === 'status' ? 'GET' : (selectedEndpoint === 'webhook' ? 'EVENT' : 'POST') }}
          </span>
          <span class="text-slate-100 font-bold">
            {{ getEndpointUrl() }}
          </span>
        </div>

        <!-- Code Snippet Box -->
        <div class="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div class="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span class="font-mono text-slate-300 font-bold">{{ selectedLang }} code example</span>
            <button (click)="copyText(getCodeSnippet())" class="hover:text-white transition-colors flex items-center gap-1 font-bold text-indigo-400">
              <i class="fa-regular fa-copy"></i>
              <span>Copy Code</span>
            </button>
          </div>
          <pre class="p-5 font-mono text-xs text-indigo-200 overflow-x-auto leading-relaxed"><code>{{ getCodeSnippet() }}</code></pre>
        </div>

        <!-- Expected Response Box -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Sample JSON Response Payload</h4>
          <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            <pre><code>{{ getResponseSnippet() }}</code></pre>
          </div>
        </div>

      </div>

      <!-- Parameter Specification Table -->
      <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 class="text-base font-bold text-slate-900">
          Backend DTO Request Parameters Specification
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th class="py-3 px-4">Backend Field Name</th>
                <th class="py-3 px-4">Data Type</th>
                <th class="py-3 px-4">Requirement</th>
                <th class="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-900">
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">phone_number</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">string</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold">REQUIRED</span></td>
                <td class="py-3.5 px-4 text-slate-600">Customer Mobile Money phone number (MTN or Orange, e.g. 692421950 or 670000001).</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">amount</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">number</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold">REQUIRED</span></td>
                <td class="py-3.5 px-4 text-slate-600">Transaction amount in XAF (minimum 1 XAF).</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">enterprise_reference</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">string</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold">REQUIRED (Charge)</span></td>
                <td class="py-3.5 px-4 text-slate-600">Unique invoice or order reference ID from your system for tracking.</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">currency</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">string</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold">OPTIONAL</span></td>
                <td class="py-3.5 px-4 text-slate-600">Currency code (defaults to XAF).</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">description</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">string</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold">OPTIONAL</span></td>
                <td class="py-3.5 px-4 text-slate-600">Order description shown to customer during payment authorization.</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">provider</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">string</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold">REQUIRED (Withdrawal)</span></td>
                <td class="py-3.5 px-4 text-slate-600">Mobile Money provider (<code class="font-mono text-indigo-700 font-bold">MTN</code> or <code class="font-mono text-indigo-700 font-bold">ORANGE</code>).</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-mono font-bold text-indigo-700">account_name</td>
                <td class="py-3.5 px-4 font-mono text-slate-500">string</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold">OPTIONAL (Withdrawal)</span></td>
                <td class="py-3.5 px-4 text-slate-600">Name on recipient Mobile Money account for payout verification.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class EnterpriseDocsComponent {
  selectedEndpoint = 'charge';
  selectedLang = 'curl';
  copiedKey = false;

  copyText(text: string): void {
    navigator.clipboard.writeText(text);
    this.copiedKey = true;
    setTimeout(() => this.copiedKey = false, 2000);
  }

  getEndpointUrl(): string {
    switch (this.selectedEndpoint) {
      case 'charge':
        return 'https://pay.poupiempire.tech/v1/enterprise/payments/request';
      case 'status':
        return 'https://pay.poupiempire.tech/v1/enterprise/payments/{poempay_reference}/status';
      case 'withdraw':
        return 'https://pay.poupiempire.tech/v1/enterprise/portal/api-keys/{api_key_id}/withdraw';
      case 'webhook':
        return 'POST YOUR_WEBHOOK_URL (Configured under Webhook Settings)';
      default:
        return '';
    }
  }

  getCodeSnippet(): string {
    if (this.selectedEndpoint === 'charge') {
      if (this.selectedLang === 'curl') {
        return `curl -X POST https://pay.poupiempire.tech/v1/enterprise/payments/request \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: pk_ent_live_YOUR_API_KEY" \\
  -d '{
    "phone_number": "692421950",
    "amount": 5000,
    "enterprise_reference": "INV-2026-001",
    "description": "Payment for Order #2026-001",
    "currency": "XAF"
  }'`;
      } else if (this.selectedLang === 'javascript') {
        return `const response = await fetch('https://pay.poupiempire.tech/v1/enterprise/payments/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'pk_ent_live_YOUR_API_KEY'
  },
  body: JSON.stringify({
    phone_number: '692421950',
    amount: 5000,
    enterprise_reference: 'INV-2026-001',
    description: 'Payment for Order #2026-001',
    currency: 'XAF'
  })
});
const data = await response.json();
console.log('PoemPay Ref:', data.poempay_reference);`;
      } else if (this.selectedLang === 'python') {
        return `import requests

url = "https://pay.poupiempire.tech/v1/enterprise/payments/request"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "pk_ent_live_YOUR_API_KEY"
}
payload = {
    "phone_number": "692421950",
    "amount": 5000,
    "enterprise_reference": "INV-2026-001",
    "description": "Payment for Order #2026-001",
    "currency": "XAF"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
      } else if (this.selectedLang === 'php') {
        return `<?php
$ch = curl_init('https://pay.poupiempire.tech/v1/enterprise/payments/request');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'x-api-key: pk_ent_live_YOUR_API_KEY'
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'phone_number' => '692421950',
  'amount' => 5000,
  'enterprise_reference' => 'INV-2026-001',
  'description' => 'Payment for Order #2026-001',
  'currency' => 'XAF'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`;
      }
    } else if (this.selectedEndpoint === 'status') {
      if (this.selectedLang === 'curl') {
        return `curl -X GET https://pay.poupiempire.tech/v1/enterprise/payments/ENT_TXN_1782950000_A1B2/status \\
  -H "x-api-key: pk_ent_live_YOUR_API_KEY"`;
      } else if (this.selectedLang === 'javascript') {
        return `const res = await fetch('https://pay.poupiempire.tech/v1/enterprise/payments/ENT_TXN_1782950000_A1B2/status', {
  headers: { 'x-api-key': 'pk_ent_live_YOUR_API_KEY' }
});
const statusData = await res.json();
console.log('Status:', statusData.status);`;
      } else if (this.selectedLang === 'python') {
        return `import requests

res = requests.get(
    "https://pay.poupiempire.tech/v1/enterprise/payments/ENT_TXN_1782950000_A1B2/status",
    headers={"x-api-key": "pk_ent_live_YOUR_API_KEY"}
)
print(res.json())`;
      } else if (this.selectedLang === 'php') {
        return `<?php
$ch = curl_init('https://pay.poupiempire.tech/v1/enterprise/payments/ENT_TXN_1782950000_A1B2/status');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-api-key: pk_ent_live_YOUR_API_KEY']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`;
      }
    } else if (this.selectedEndpoint === 'withdraw') {
      if (this.selectedLang === 'curl') {
        return `curl -X POST https://pay.poupiempire.tech/v1/enterprise/portal/api-keys/KEY_UUID/withdraw \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "amount": 10000,
    "provider": "MTN",
    "phone_number": "692421950",
    "account_name": "John Doe"
  }'`;
      } else if (this.selectedLang === 'javascript') {
        return `const res = await fetch('https://pay.poupiempire.tech/v1/enterprise/portal/api-keys/KEY_UUID/withdraw', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ amount: 10000, provider: 'MTN', phone_number: '692421950', account_name: 'John Doe' })
});
console.log(await res.json());`;
      } else if (this.selectedLang === 'python') {
        return `import requests

res = requests.post(
    "https://pay.poupiempire.tech/v1/enterprise/portal/api-keys/KEY_UUID/withdraw",
    headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
    json={"amount": 10000, "provider": "MTN", "phone_number": "692421950", "account_name": "John Doe"}
)
print(res.json())`;
      } else if (this.selectedLang === 'php') {
        return `<?php
$ch = curl_init('https://pay.poupiempire.tech/v1/enterprise/portal/api-keys/KEY_UUID/withdraw');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'Authorization: Bearer ' . $token
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'amount' => 10000,
  'provider' => 'MTN',
  'phone_number' => '692421950',
  'account_name' => 'John Doe'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`;
      }
    } else {
      return `// ExpressJS Node.js Webhook Receiver Example
app.post('/webhooks/poempay', (req, res) => {
  const { event, data } = req.body;
  const { transaction_id, status, enterprise_reference, amount } = data || {};

  if (status === 'APPROVED') {
    // Process order fulfillment logic
    console.log(\`Payment approved for \${enterprise_reference} (\${amount} XAF)\`);
  }

  res.status(200).send({ status: 'SUCCESS' });
});`;
    }
    return '';
  }

  getResponseSnippet(): string {
    switch (this.selectedEndpoint) {
      case 'charge':
        return `{
  "status": "success",
  "transaction_id": "8f7a6b5c-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
  "poempay_reference": "ENT_TXN_1782950000_A1B2",
  "enterprise_reference": "INV-2026-001",
  "state": "PENDING_USER_APPROVAL",
  "expires_at": "2026-07-25T08:45:00.000Z"
}`;
      case 'status':
        return `{
  "transaction_id": "8f7a6b5c-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
  "enterprise_reference": "INV-2026-001",
  "poempay_reference": "ENT_TXN_1782950000_A1B2",
  "customer_phone": "692421950",
  "amount": 5000,
  "currency": "XAF",
  "status": "APPROVED",
  "created_at": "2026-07-25T08:43:00.000Z",
  "approved_at": "2026-07-25T08:44:00.000Z"
}`;
      case 'withdraw':
        return `{
  "id": "WITH-78295002",
  "reference": "WITH-78295002",
  "amount": 10000,
  "phone_number": "692421950",
  "account_name": "John Doe",
  "status": "APPROVED",
  "message": "Withdrawal payout processed successfully from API Key wallet."
}`;
      case 'webhook':
        return `{
  "event": "enterprise.payment.updated",
  "data": {
    "transaction_id": "8f7a6b5c-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
    "status": "APPROVED",
    "enterprise_reference": "INV-2026-001",
    "amount": 5000,
    "currency": "XAF",
    "approved_at": "2026-07-25T08:44:00.000Z"
  }
}`;
      default:
        return '';
    }
  }
}

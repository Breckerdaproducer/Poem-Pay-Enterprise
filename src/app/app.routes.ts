import { Routes } from '@angular/router';
import { guestGuard, enterpriseGuard } from './guards/auth.guard';
import { EnterpriseLoginComponent } from './enterprise/login/enterprise-login.component';
import { EnterpriseOtpComponent } from './enterprise/otp/enterprise-otp.component';
import { EnterpriseLayoutComponent } from './enterprise/layout/enterprise-layout.component';
import { EnterpriseOverviewComponent } from './enterprise/overview/enterprise-overview.component';
import { EnterpriseApiKeysComponent } from './enterprise/keys/enterprise-api-keys.component';
import { EnterpriseTransactionsComponent } from './enterprise/transactions/enterprise-transactions.component';
import { EnterpriseWebhooksComponent } from './enterprise/webhooks/enterprise-webhooks.component';
import { EnterpriseDocsComponent } from './enterprise/docs/enterprise-docs.component';
import { EnterpriseSettingsComponent } from './enterprise/settings/enterprise-settings.component';
import { ApiKeyDetailComponent } from './enterprise/keys/api-key-detail.component';

export const routes: Routes = [
  { path: 'login', component: EnterpriseLoginComponent, title: 'PoemPay - Enterprise Login', canActivate: [guestGuard] },
  { path: 'otp', component: EnterpriseOtpComponent, title: 'PoemPay - Enterprise 2FA Verification', canActivate: [guestGuard] },
  { path: 'otp/:token', component: EnterpriseOtpComponent, title: 'PoemPay - Enterprise 2FA Verification', canActivate: [guestGuard] },
  {
    path: '',
    component: EnterpriseLayoutComponent,
    canActivate: [enterpriseGuard],
    canActivateChild: [enterpriseGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EnterpriseOverviewComponent, title: 'PoemPay - Enterprise Overview' },
      { path: 'api-keys', component: EnterpriseApiKeysComponent, title: 'PoemPay - Enterprise API Keys' },
      { path: 'api-keys/:id', component: ApiKeyDetailComponent, title: 'PoemPay - API Key Wallet & Overview' },
      { path: 'transactions', component: EnterpriseTransactionsComponent, title: 'PoemPay - Enterprise Transactions' },
      { path: 'webhooks', component: EnterpriseWebhooksComponent, title: 'PoemPay - Enterprise Webhook Settings' },
      { path: 'settings', component: EnterpriseSettingsComponent, title: 'PoemPay - Enterprise Profile & Settings' },
      { path: 'docs', component: EnterpriseDocsComponent, title: 'PoemPay - API Documentation & Developer Guide' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

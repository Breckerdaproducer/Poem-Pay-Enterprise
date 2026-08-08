import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Enterprise {
  id: string;
  name: string;
  email: string;
  phone?: string;
  logo_url?: string;
  avatar_url?: string;
  mfa_enabled?: boolean;
  is_2fa_enabled?: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  environment: 'TEST' | 'LIVE';
  webhook_url?: string;
  webhook_secret?: string;
  custom_fee_percentage: number;
  created_at: string;
  user?: any;
}

export interface EnterpriseApiKey {
  id: string;
  name: string;
  website_url?: string;
  webhook_url?: string;
  webhook_secret?: string;
  public_key: string;
  secret_key?: string; // Returned only on key generation
  environment: 'TEST' | 'LIVE';
  is_active: boolean;
  is_withdrawal_enabled?: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface EnterpriseTransaction {
  id: string;
  type?: 'PAYMENT' | 'DEPOSIT' | 'WITHDRAWAL';
  customer_phone: string;
  amount: number;
  fee?: number;
  currency: string;
  status: 'PENDING_USER_APPROVAL' | 'APPROVED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  enterprise_reference: string;
  poempay_reference: string;
  created_at: string;
  approved_at?: string;
  failure_reason?: string;
  enterprise?: { id: string; name: string };
}

export interface EnterpriseDeposit {
  id: string;
  enterprise_id: string;
  api_key_id: string;
  amount: number;
  fee?: number;
  phone_number: string;
  operator?: string;
  reference: string;
  campay_reference?: string;
  status: 'PENDING' | 'APPROVED' | 'FAILED';
  created_at: string;
  updated_at: string;
  enterprise?: { id: string; name: string };
  apiKey?: { id: string; name: string };
}

export interface EnterpriseWithdrawal {
  id: string;
  enterprise_id: string;
  api_key_id: string;
  amount: number;
  fee?: number;
  phone_number: string;
  account_name?: string;
  reference: string;
  campay_reference?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  enterprise?: { id: string; name: string };
  apiKey?: { id: string; name: string };
}

export interface EnterpriseAnalytics {
  range?: string;
  total_volume: number;
  fee_percentage?: number;
  net_earnings?: number;
  total_deposits?: number;
  total_withdrawn?: number;
  available_balance?: number;
  total_transactions: number;
  successful_transactions: number;
  cancelled_transactions: number;
  expired_transactions: number;
  failed_transactions?: number;
  pending_transactions?: number;
  success_rate: string;
  status_distribution?: {
    approved: number;
    pending: number;
    cancelled: number;
    expired: number;
    failed: number;
  };
  trend?: {
    labels: string[];
    volume: number[];
    net_earnings: number[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class EnterpriseService {
  private baseUrl = environment.backendUrl ? environment.backendUrl.replace(/\/+$/, '') : '';

  // --- Global Enterprise State Management ---
  private enterpriseSubject = new BehaviorSubject<Enterprise | null>(null);
  public enterprise$: Observable<Enterprise | null> = this.enterpriseSubject.asObservable();

  private analyticsSubject = new BehaviorSubject<EnterpriseAnalytics | null>(null);
  public analytics$: Observable<EnterpriseAnalytics | null> = this.analyticsSubject.asObservable();

  private apiKeysSubject = new BehaviorSubject<EnterpriseApiKey[]>([]);
  public apiKeys$: Observable<EnterpriseApiKey[]> = this.apiKeysSubject.asObservable();

  private transactionsSubject = new BehaviorSubject<EnterpriseTransaction[]>([]);
  public transactions$: Observable<EnterpriseTransaction[]> = this.transactionsSubject.asObservable();

  public get currentEnterprise(): Enterprise | null {
    return this.enterpriseSubject.getValue();
  }

  public setEnterprise(profile: Enterprise | null): void {
    this.enterpriseSubject.next(profile);
  }

  constructor(private http: HttpClient) {}

  // --- Super Admin APIs ---
  getAllEnterprises(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ): Observable<PaginatedResponse<Enterprise>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (status) queryParams += `&status=${encodeURIComponent(status)}`;

    return this.http.get<PaginatedResponse<Enterprise>>(
      `${this.baseUrl}/admin/enterprises${queryParams}`,
      { withCredentials: true },
    );
  }

  getEnterpriseDetailsAdmin(id: string): Observable<Enterprise> {
    return this.http.get<Enterprise>(`${this.baseUrl}/admin/enterprises/${id}`, {
      withCredentials: true,
    });
  }

  getEnterpriseTransactionsAdminList(
    id: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Observable<PaginatedResponse<EnterpriseTransaction>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;

    return this.http.get<PaginatedResponse<EnterpriseTransaction>>(
      `${this.baseUrl}/admin/enterprises/${id}/transactions${queryParams}`,
      { withCredentials: true },
    );
  }

  getAllEnterpriseTransactionsAdmin(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ): Observable<PaginatedResponse<EnterpriseTransaction>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (status) queryParams += `&status=${encodeURIComponent(status)}`;

    return this.http.get<PaginatedResponse<EnterpriseTransaction>>(
      `${this.baseUrl}/admin/enterprises/all-transactions${queryParams}`,
      { withCredentials: true },
    );
  }

  getAllEnterpriseDepositsAdmin(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ): Observable<PaginatedResponse<EnterpriseDeposit>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (status) queryParams += `&status=${encodeURIComponent(status)}`;

    return this.http.get<PaginatedResponse<EnterpriseDeposit>>(
      `${this.baseUrl}/admin/enterprises/all-deposits${queryParams}`,
      { withCredentials: true },
    );
  }

  getAllEnterpriseWithdrawalsAdmin(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ): Observable<PaginatedResponse<EnterpriseWithdrawal>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (status) queryParams += `&status=${encodeURIComponent(status)}`;

    return this.http.get<PaginatedResponse<EnterpriseWithdrawal>>(
      `${this.baseUrl}/admin/enterprises/all-withdrawals${queryParams}`,
      { withCredentials: true },
    );
  }

  getEnterpriseDepositsAdminList(
    id: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Observable<PaginatedResponse<EnterpriseDeposit>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;

    return this.http.get<PaginatedResponse<EnterpriseDeposit>>(
      `${this.baseUrl}/admin/enterprises/${id}/deposits${queryParams}`,
      { withCredentials: true },
    );
  }

  getEnterpriseWithdrawalsAdminList(
    id: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Observable<PaginatedResponse<EnterpriseWithdrawal>> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;

    return this.http.get<PaginatedResponse<EnterpriseWithdrawal>>(
      `${this.baseUrl}/admin/enterprises/${id}/withdrawals${queryParams}`,
      { withCredentials: true },
    );
  }

  createEnterprise(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/enterprises`, data, {
      withCredentials: true,
    });
  }

  updateEnterpriseStatus(id: string, status: string): Observable<Enterprise> {
    return this.http.patch<Enterprise>(
      `${this.baseUrl}/admin/enterprises/${id}/status`,
      { status },
      { withCredentials: true },
    );
  }

  getOverallAdminAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/enterprises/overall-analytics`, {
      withCredentials: true,
    });
  }

  getEnterpriseAnalyticsAdmin(id: string): Observable<EnterpriseAnalytics> {
    return this.http.get<EnterpriseAnalytics>(
      `${this.baseUrl}/admin/enterprises/${id}/analytics`,
      { withCredentials: true },
    );
  }

  // --- Enterprise Portal APIs ---
  getPortalProfile(): Observable<Enterprise> {
    return this.http.get<Enterprise>(`${this.baseUrl}/v1/enterprise/portal/profile`, {
      withCredentials: true,
    }).pipe(
      tap(profile => this.enterpriseSubject.next(profile))
    );
  }

  getPortalAnalytics(range: string = 'week'): Observable<EnterpriseAnalytics> {
    return this.http.get<EnterpriseAnalytics>(`${this.baseUrl}/v1/enterprise/portal/analytics?range=${range}`, {
      withCredentials: true,
    }).pipe(
      tap(analytics => this.analyticsSubject.next(analytics))
    );
  }

  getApiKeys(page?: number, limit?: number, search?: string): Observable<any> {
    let queryParams = '';
    if (page && limit) {
      queryParams = `?page=${page}&limit=${limit}`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    } else if (search) {
      queryParams = `?search=${encodeURIComponent(search)}`;
    }

    return this.http.get<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys${queryParams}`, {
      withCredentials: true,
    }).pipe(
      tap(res => {
        if (res && res.data) {
          this.apiKeysSubject.next(res.data);
        } else if (Array.isArray(res)) {
          this.apiKeysSubject.next(res);
        }
      })
    );
  }

  createApiKey(name: string, website_url: string, environment: 'TEST' | 'LIVE' = 'LIVE', webhook_url?: string): Observable<EnterpriseApiKey> {
    return this.http.post<EnterpriseApiKey>(
      `${this.baseUrl}/v1/enterprise/portal/api-keys`,
      { name, website_url, environment, webhook_url },
      { withCredentials: true },
    ).pipe(
      tap(() => this.getApiKeys().subscribe())
    );
  }

  updateApiKeyWebhook(keyId: string, webhook_url: string): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/v1/enterprise/portal/api-keys/${keyId}/webhook`,
      { webhook_url },
      { withCredentials: true },
    ).pipe(
      tap(() => this.getApiKeys().subscribe())
    );
  }

  revokeApiKey(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}/revoke`, {}, {
      withCredentials: true,
    }).pipe(
      tap(() => this.getApiKeys().subscribe())
    );
  }

  rollSecretKey(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}/roll-secret`, {}, {
      withCredentials: true,
    }).pipe(
      tap(() => this.getApiKeys().subscribe())
    );
  }

  deleteApiKey(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}`, {
      withCredentials: true,
    }).pipe(
      tap(() => this.getApiKeys().subscribe())
    );
  }

  getApiKeyDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}`, {
      withCredentials: true,
    });
  }

  depositToApiKey(id: string, data: { amount: number; provider: string; phone_number: string }): Observable<any> {
    const payload = { ...data, key_id: id };
    return this.http.post<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/deposit`, payload, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        this.getApiKeys().subscribe();
        this.getPortalAnalytics().subscribe();
      })
    );
  }

  withdrawFromApiKey(id: string, data: { amount: number; provider: string; phone_number: string; account_name?: string }): Observable<any> {
    const payload = { ...data, key_id: id };
    return this.http.post<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/withdraw`, payload, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        this.getApiKeys().subscribe();
        this.getPortalAnalytics().subscribe();
      })
    );
  }

  updateApiKeyWithdrawalPermission(id: string, is_withdrawal_enabled: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}/withdrawal-permission`, { is_withdrawal_enabled }, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        this.getApiKeys().subscribe();
      })
    );
  }

  updateApiKeySecurity(id: string, data: { allowed_ip_addresses?: string[]; is_ip_whitelist_enabled?: boolean; max_rpm_limit?: number }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}/security`, data, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        this.getApiKeys().subscribe();
      })
    );
  }

  createPaymentLink(id: string, data: { title: string; description?: string; amount?: number; is_fixed_amount?: boolean; redirect_url?: string; expires_in_days?: number }): Observable<any> {
    const payload = { ...data, key_id: id };
    return this.http.post<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}/payment-links`, payload, {
      withCredentials: true,
    });
  }

  getPaymentLinks(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/enterprise/portal/api-keys/${id}/payment-links`, {
      withCredentials: true,
    });
  }

  updateWebhook(webhook_url: string): Observable<Enterprise> {
    return this.http.patch<Enterprise>(
      `${this.baseUrl}/v1/enterprise/portal/webhook`,
      { webhook_url },
      { withCredentials: true },
    ).pipe(
      tap(updated => {
        const current = this.enterpriseSubject.getValue();
        if (current) {
          this.enterpriseSubject.next({ ...current, webhook_url: updated.webhook_url || webhook_url });
        } else {
          this.getPortalProfile().subscribe();
        }
      })
    );
  }

  getPortalTransactions(
    page: number = 1,
    limit: number = 25,
    search?: string,
    status?: string,
    sortBy: string = 'DATE_DESC',
    type?: string,
    apiKeyId?: string,
  ): Observable<any> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'ALL') queryParams += `&status=${encodeURIComponent(status)}`;
    if (type && type !== 'ALL') queryParams += `&type=${encodeURIComponent(type)}`;
    if (sortBy) queryParams += `&sortBy=${encodeURIComponent(sortBy)}`;
    if (apiKeyId) queryParams += `&apiKeyId=${encodeURIComponent(apiKeyId)}`;

    return this.http.get<any>(
      `${this.baseUrl}/v1/enterprise/portal/transactions${queryParams}`,
      { withCredentials: true },
    ).pipe(
      tap(res => {
        if (res && res.data) {
          this.transactionsSubject.next(res.data);
        } else if (Array.isArray(res)) {
          this.transactionsSubject.next(res);
        }
      })
    );
  }

  getHolderInfo(phoneNumber: string): Observable<{ name: string; operator: string }> {
    return this.http.get<{ name: string; operator: string }>(
      `${this.baseUrl}/v1/enterprise/portal/holder-info?phone_number=${encodeURIComponent(phoneNumber)}`,
      { withCredentials: true },
    );
  }

  updatePortalProfile(data: { name?: string; email?: string; phone?: string; logo_url?: string; avatar_url?: string }): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/v1/enterprise/portal/profile`,
      data,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res && res.enterprise) {
          this.enterpriseSubject.next(res.enterprise);
        } else {
          this.getPortalProfile().subscribe();
        }
      })
    );
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(
      `${this.baseUrl}/v1/enterprise/portal/avatar`,
      formData,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res && res.enterprise) {
          this.enterpriseSubject.next(res.enterprise);
        } else if (res && (res.avatar_url || res.logo_url)) {
          const newUrl = res.avatar_url || res.logo_url;
          const current = this.enterpriseSubject.getValue();
          if (current) {
            this.enterpriseSubject.next({
              ...current,
              logo_url: newUrl,
              avatar_url: newUrl
            });
          }
        }
      })
    );
  }

  requestPasswordOtp(): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/v1/enterprise/portal/request-password-otp`,
      {},
      { withCredentials: true }
    );
  }

  changePasswordWithOtp(data: { currentPassword?: string; newPassword: string; otp: string }): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/v1/enterprise/portal/change-password`,
      data,
      { withCredentials: true }
    );
  }

  get2faStatus(): Observable<{ mfa_enabled: boolean; is_2fa_enabled: boolean }> {
    return this.http.get<{ mfa_enabled: boolean; is_2fa_enabled: boolean }>(
      `${this.baseUrl}/v1/enterprise/portal/2fa/status`,
      { withCredentials: true }
    );
  }

  generate2fa(): Observable<{ secret: string; qrCodeDataUrl: string }> {
    return this.http.post<{ secret: string; qrCodeDataUrl: string }>(
      `${this.baseUrl}/v1/enterprise/portal/2fa/generate`,
      {},
      { withCredentials: true }
    );
  }

  enable2fa(code: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/v1/enterprise/portal/2fa/enable`,
      { code },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        const current = this.enterpriseSubject.getValue();
        if (current) {
          this.enterpriseSubject.next({ ...current, mfa_enabled: true, is_2fa_enabled: true });
        }
      })
    );
  }

  disable2fa(code: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/v1/enterprise/portal/2fa/disable`,
      { code },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        const current = this.enterpriseSubject.getValue();
        if (current) {
          this.enterpriseSubject.next({ ...current, mfa_enabled: false, is_2fa_enabled: false });
        }
      })
    );
  }
}


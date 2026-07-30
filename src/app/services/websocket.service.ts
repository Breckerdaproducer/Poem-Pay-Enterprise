import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface SocketStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private statusSubject = new BehaviorSubject<SocketStatus>({ connected: false, connecting: false });
  public status$ = this.statusSubject.asObservable();

  // Transactions
  private transactionNewSubject = new Subject<any>();
  public transactionNew$ = this.transactionNewSubject.asObservable();

  private transactionUpdatedSubject = new Subject<any>();
  public transactionUpdated$ = this.transactionUpdatedSubject.asObservable();

  private statsUpdatedSubject = new Subject<any>();
  public statsUpdated$ = this.statsUpdatedSubject.asObservable();

  // Ledger
  private ledgerNewSubject = new Subject<any>();
  public ledgerNew$ = this.ledgerNewSubject.asObservable();

  private ledgerStatsUpdatedSubject = new Subject<any>();
  public ledgerStatsUpdated$ = this.ledgerStatsUpdatedSubject.asObservable();

  // Audit Logs
  private auditNewSubject = new Subject<any>();
  public auditNew$ = this.auditNewSubject.asObservable();

  // Enterprise Transactions
  private enterpriseTransactionSubject = new Subject<any>();
  public enterpriseTransaction$ = this.enterpriseTransactionSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  connect(): void {
    if (!isPlatformBrowser(this.platformId) || this.socket) {
      return;
    }

    this.statusSubject.next({ connected: false, connecting: true });

    let baseUrl = environment.backendUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    this.socket = io(baseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('⚡ [WebsocketService] Real-time gateway connected:', this.socket?.id);
      this.statusSubject.next({ connected: true, connecting: false });
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ [WebsocketService] Gateway connection error:', err.message);
      this.statusSubject.next({ connected: false, connecting: false, error: err.message });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 [WebsocketService] Gateway disconnected:', reason);
      this.statusSubject.next({ connected: false, connecting: false });
    });

    // Transactions listeners
    this.socket.on('transaction:new', (data: any) => {
 
      this.transactionNewSubject.next(data);
    });

    this.socket.on('transaction_created', (data: any) => {

      this.transactionNewSubject.next(data);
    });

    this.socket.on('transaction:updated', (data: any) => {

      this.transactionUpdatedSubject.next(data);
    });

    this.socket.on('transaction_updated', (data: any) => {

      this.transactionUpdatedSubject.next(data);
    });

    this.socket.on('stats:updated', (data: any) => {

      this.statsUpdatedSubject.next(data);
    });

    // Enterprise Listeners
    this.socket.on('enterprise:payment_status', (data: any) => {
      this.enterpriseTransactionSubject.next(data);
      this.transactionUpdatedSubject.next(data);
    });

    this.socket.on('enterprise:transaction_updated', (data: any) => {
      this.enterpriseTransactionSubject.next(data);
      this.transactionUpdatedSubject.next(data);
    });

    this.socket.on('enterprise:payment_prompt', (data: any) => {
      this.enterpriseTransactionSubject.next(data);
      this.transactionNewSubject.next(data);
    });

    // Ledger listeners
    this.socket.on('ledger:new', (data: any) => {

      this.ledgerNewSubject.next(data);
    });

    this.socket.on('ledger_batch_created', (data: any) => {

      this.ledgerNewSubject.next(data);
    });

    this.socket.on('ledger:stats_updated', (data: any) => {

      this.ledgerStatsUpdatedSubject.next(data);
    });

    // Audit logs listeners
    this.socket.on('audit:new', (data: any) => {

      this.auditNewSubject.next(data);
    });

    this.socket.on('audit_log_created', (data: any) => {

      this.auditNewSubject.next(data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.statusSubject.next({ connected: false, connecting: false });
    }
  }
}

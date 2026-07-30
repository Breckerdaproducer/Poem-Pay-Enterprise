import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingState = signal(false);

  // Read-only signal for components to bind to
  readonly isLoading = this.loadingState.asReadonly();

  show(): void {
    this.loadingState.set(true);
  }

  hide(): void {
    this.loadingState.set(false);
  }
}

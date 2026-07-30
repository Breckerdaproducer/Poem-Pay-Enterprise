import { Component, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loaderService.isLoading()" 
         class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300">
      <div class="flex flex-col items-center gap-4 p-6 bg-slate-900/90 rounded-2xl shadow-2xl border border-slate-800/80 max-w-[240px] w-full text-center">
        <!-- Spinner -->
        <div class="relative w-12 h-12">
          <!-- Outer track -->
          <div class="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <!-- Inner spinner -->
          <div class="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <span class="text-sm font-semibold text-slate-200 tracking-wide">Please wait...</span>
      </div>
    </div>
  `
})
export class LoaderComponent {
  constructor(
    public loaderService: LoaderService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      this.loaderService.isLoading();
      this.cdr.detectChanges();
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageViewerService } from '../../services/image-viewer.service';

@Component({
  selector: 'app-image-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="imageViewer.activeImage()" 
         class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-fade-in"
         (click)="closeOnBackdrop($event)">
      
      <!-- Modal Container -->
      <div class="relative max-w-4xl w-full bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-up"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm shrink-0 border border-indigo-500/30">
              <i class="fa-solid fa-user-gear"></i>
            </div>
            <div class="truncate">
              <h3 class="text-sm font-bold text-white truncate">
                {{ imageViewer.activeImage()?.title || 'Profile Picture' }}
              </h3>
              <p *ngIf="imageViewer.activeImage()?.subtitle" class="text-[10px] text-slate-400 truncate font-mono">
                {{ imageViewer.activeImage()?.subtitle }}
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <a [href]="imageViewer.activeImage()?.imageUrl" download target="_blank" rel="noopener noreferrer"
               class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
               title="Download Image">
              <i class="fa-solid fa-download text-[10px]"></i>
              <span>Download</span>
            </a>
            <button (click)="imageViewer.close()"
                    class="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/80 text-white flex items-center justify-center text-xs transition-colors"
                    title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- High-Res Image Preview -->
        <div class="p-6 flex items-center justify-center bg-black/70 overflow-auto min-h-[350px]">
          <img [src]="imageViewer.activeImage()?.imageUrl" 
               [alt]="imageViewer.activeImage()?.title || 'Profile Avatar'" 
               class="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-[1.01]"/>
        </div>
      </div>
    </div>
  `
})
export class ImageViewerModalComponent {
  imageViewer = inject(ImageViewerService);

  closeOnBackdrop(event: MouseEvent): void {
    this.imageViewer.close();
  }
}

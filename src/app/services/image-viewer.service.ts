import { Injectable, signal } from '@angular/core';

export interface ImageViewerConfig {
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageViewerService {
  activeImage = signal<ImageViewerConfig | null>(null);

  open(imageUrl: string, title?: string, subtitle?: string): void {
    if (!imageUrl || !imageUrl.trim()) return;
    this.activeImage.set({ imageUrl, title, subtitle });
  }

  close(): void {
    this.activeImage.set(null);
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/loader/loader.component';
import { ImageViewerModalComponent } from './shared/image-viewer-modal/image-viewer-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoaderComponent, ImageViewerModalComponent],
  template: '<router-outlet /><app-loader /><app-image-viewer-modal />'
})
export class App {}
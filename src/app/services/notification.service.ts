import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private isBrowser: boolean;

  constructor(
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  success(message: string, title: string = 'Success') {
    if (this.isBrowser) {
      this.toastr.success(message, title);
    }
  }

  error(message: string, title: string = 'Error') {
    if (this.isBrowser) {
      this.toastr.error(message, title);
    }
  }

  info(message: string, title: string = 'Info') {
    if (this.isBrowser) {
      this.toastr.info(message, title);
    }
  }

  warning(message: string, title: string = 'Warning') {
    if (this.isBrowser) {
      this.toastr.warning(message, title);
    }
  }

  showSuccess(message: string, title: string = 'Success') {
    this.success(message, title);
  }

  showError(message: string, title: string = 'Error') {
    this.error(message, title);
  }

  showInfo(message: string, title: string = 'Info') {
    this.info(message, title);
  }

  showWarning(message: string, title: string = 'Warning') {
    this.warning(message, title);
  }
}


import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'otp', renderMode: RenderMode.Prerender },
  { path: 'otp/:token', renderMode: RenderMode.Server },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];

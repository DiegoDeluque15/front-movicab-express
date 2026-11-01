import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionStore } from './session.store';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const session = inject(SessionStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Las peticiones a APIs externas (OSRM, Nominatim, OpenStreetMap, etc.) no deben llevar
  // la cabecera 'Authorization' para evitar bloqueos por CORS preflight en servidores públicos.
  const isInternalApi = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');
  if (!isInternalApi) {
    return next(req);
  }

  const token = session.token();
  const isAuthEndpoint =
    req.url.includes('/sesion/login') ||
    req.url.includes('/sesion/refresh') ||
    req.url.includes('/sesion/logout') ||
    req.url.includes('/pasajeros/registro');

  // Si hay token y no es endpoint abierto de autenticación/registro, inyectamos Bearer
  const authReq = token && !isAuthEndpoint
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // Si falló login, registro o refresh, no reintentamos: expulsamos a login
        if (isAuthEndpoint || !session.refreshToken()) {
          session.clear();
          router.navigate(['/login']);
          return throwError(() => err);
        }

        // Token expirado: intentamos rotación automática con refresh token
        return authService.refresh().pipe(
          switchMap((newTokens) => {
            const retriedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newTokens.access_token}` },
            });
            return next(retriedReq);
          }),
          catchError((refreshErr) => {
            // El refresh token también expiró o fue revocado
            session.clear();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};

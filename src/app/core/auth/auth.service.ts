import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  SessionTokens,
  ProfileUser,
  EffectivePermission,
} from './auth.model';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly base = environment.apiUrl;

  /**
   * Inicia sesión:
   * 1. Solicita tokens a /api/sesion/login
   * 2. Recupera perfil y permisos efectivos de forma concurrente
   * 3. Almacena tokens, perfil y permisos en el store reactivo
   */
  login(credentials: LoginRequest): Observable<{ user: ProfileUser; permissions: EffectivePermission[] }> {
    return this.http
      .post<SessionTokens>(`${this.base}/sesion/login`, credentials)
      .pipe(
        switchMap((tokens) => {
          // Temporalmente actualizamos el access_token para que el interceptor
          // pueda autorizar las llamadas subsiguientes a /perfil y /permisos
          this.session.updateTokens(tokens);

          return forkJoin({
            profileRes: this.fetchProfile(),
            permissionsRes: this.fetchPermissions(),
          }).pipe(
            tap(({ profileRes, permissionsRes }) => {
              this.session.saveSession(tokens, profileRes.user, permissionsRes.permissions);
            }),
            switchMap(({ profileRes, permissionsRes }) =>
              of({ user: profileRes.user, permissions: permissionsRes.permissions })
            )
          );
        })
      );
  }

  /**
   * Renueva el par de tokens usando el refresh_token actual
   */
  refresh(): Observable<SessionTokens> {
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http
      .post<SessionTokens>(`${this.base}/sesion/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((newTokens) => {
          this.session.updateTokens(newTokens);
        })
      );
  }

  /**
   * Cierra sesión:
   * 1. Revoca la familia de tokens en el backend (/api/sesion/logout)
   * 2. Limpia el almacenamiento local
   * 3. Redirige a /login
   */
  logout(): void {
    const refreshToken = this.session.refreshToken();

    if (refreshToken) {
      this.http
        .post(`${this.base}/sesion/logout`, { refresh_token: refreshToken })
        .pipe(
          catchError(() => of(null)) // Si falla el endpoint, igual limpiamos el cliente
        )
        .subscribe(() => {
          this.session.clear();
          this.router.navigate(['/login']);
        });
    } else {
      this.session.clear();
      this.router.navigate(['/login']);
    }
  }

  /** Consulta el perfil del usuario autenticado */
  fetchProfile(): Observable<{ user: ProfileUser }> {
    return this.http.get<{ user: ProfileUser }>(`${this.base}/sesion/perfil`);
  }

  /** Consulta los permisos efectivos calculados por el backend */
  fetchPermissions(): Observable<{ permissions: EffectivePermission[] }> {
    return this.http.get<{ permissions: EffectivePermission[] }>(`${this.base}/permisos`);
  }
}

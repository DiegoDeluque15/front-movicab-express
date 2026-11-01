import { Injectable, signal, computed } from '@angular/core';
import { ProfileUser, EffectivePermission, SessionTokens } from './auth.model';

const TOKEN_KEY = 'mvc_token';
const REFRESH_KEY = 'mvc_refresh_token';
const USER_KEY = 'mvc_user';
const PERMISSIONS_KEY = 'mvc_permissions';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(REFRESH_KEY));
  private readonly _user = signal<ProfileUser | null>(this.loadUser());
  private readonly _permissions = signal<EffectivePermission[]>(this.loadPermissions());

  /** Access Token JWT activo */
  readonly token = this._token.asReadonly();

  /** Refresh Token para rotación */
  readonly refreshToken = this._refreshToken.asReadonly();

  /** Usuario autenticado */
  readonly user = this._user.asReadonly();

  /** Permisos efectivos otorgados al usuario */
  readonly permissions = this._permissions.asReadonly();

  /** Estado de autenticación activo */
  readonly isLoggedIn = computed(() => this._token() !== null);

  /** Roles únicos asignados al usuario derivados de sus permisos efectivos */
  readonly roles = computed(() =>
    Array.from(new Set(this._permissions().map((p) => p.role_name).filter((r): r is string => !!r)))
  );

  /** Verificador de membresía de rol */
  hasRole(roleName: string): boolean {
    const target = roleName.toUpperCase();
    return this.roles().some((r) => r.toUpperCase() === target);
  }

  /** Verificadores específicos de roles clave */
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly isDespacho = computed(() => this.hasRole('DESPACHO') || this.hasRole('ADMIN'));
  readonly isDriver = computed(() => this.hasRole('CONDUCTOR'));
  readonly isPassenger = computed(() => this.hasRole('PASAJERO'));

  /** Guarda sesión completa tras login */
  saveSession(tokens: SessionTokens, user: ProfileUser, permissions: EffectivePermission[]): void {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));

    this._token.set(tokens.access_token);
    this._refreshToken.set(tokens.refresh_token);
    this._user.set(user);
    this._permissions.set(permissions);
  }

  /** Actualiza los tokens tras una rotación de refresh exitosa */
  updateTokens(tokens: SessionTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);

    this._token.set(tokens.access_token);
    this._refreshToken.set(tokens.refresh_token);
  }

  /** Actualiza el perfil del usuario */
  updateProfile(user: ProfileUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  /** Actualiza la lista de permisos efectivos */
  updatePermissions(permissions: EffectivePermission[]): void {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    this._permissions.set(permissions);
  }

  /** Limpia completamente la sesión del cliente */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);

    this._token.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._permissions.set([]);
  }

  private loadUser(): ProfileUser | null {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as ProfileUser) : null;
    } catch {
      return null;
    }
  }

  private loadPermissions(): EffectivePermission[] {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    try {
      return raw ? (JSON.parse(raw) as EffectivePermission[]) : [];
    } catch {
      return [];
    }
  }
}

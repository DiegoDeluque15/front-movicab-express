import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/**
 * Generador de guard para autorizar rutas según roles esperados.
 * Si el usuario no tiene los roles requeridos, redirige a /dashboard o /login.
 */
export function requireRoles(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    const router = inject(Router);

    if (!session.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    const hasAnyRole = allowedRoles.some((role) => session.hasRole(role));
    if (hasAnyRole) {
      return true;
    }

    // Usuario autenticado pero sin rol suficiente
    return router.createUrlTree(['/dashboard']);
  };
}

export const passengerGuard: CanActivateFn = requireRoles('PASAJERO', 'ADMIN', 'DESPACHO');
export const driverGuard: CanActivateFn = requireRoles('CONDUCTOR', 'ADMIN', 'DESPACHO');
export const dispatchGuard: CanActivateFn = requireRoles('DESPACHO', 'ADMIN');
export const adminGuard: CanActivateFn = requireRoles('ADMIN');


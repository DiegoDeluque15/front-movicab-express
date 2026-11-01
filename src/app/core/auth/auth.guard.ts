import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/**
 * Guard funcional que protege las rutas de la shell autenticada.
 * Si no hay token activo redirige a /login.
 */
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (session.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

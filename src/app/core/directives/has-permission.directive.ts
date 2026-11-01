import {
  Directive,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
  effect,
} from '@angular/core';
import { SessionStore } from '../auth/session.store';
import { hasPermission } from '../utils/has-permission';

/**
 * Directiva estructural que muestra o elimina el elemento del DOM
 * según si el usuario autenticado tiene el permiso indicado.
 *
 * Uso:
 *   <button *appHasPermission="'POST /api/conductores'">Nuevo conductor</button>
 *
 *   o equivalente con forma canónica:
 *   <ng-template appHasPermission="'GET /api/pasajeros'">...</ng-template>
 *
 * El valor es un string con formato "MÉTODO /ruta", p. ej.:
 *   'GET /api/pasajeros'   → muestra si hay permiso GET sobre /api/pasajeros
 *   'POST /api/carreras'   → muestra si hay permiso POST sobre /api/carreras
 */
@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  /** Valor de la directiva: "MÉTODO /ruta/recurso" */
  readonly appHasPermission = input.required<string>();

  private readonly session = inject(SessionStore);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vc = inject(ViewContainerRef);
  private hasView = false;

  constructor() {
    effect(() => {
      const permissions = this.session.permissions();
      const [method, ...pathParts] = this.appHasPermission().trim().split(' ');
      const path = pathParts.join(' ');
      const allowed = hasPermission(permissions, method, path);

      if (allowed && !this.hasView) {
        this.vc.createEmbeddedView(this.tpl);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.vc.clear();
        this.hasView = false;
      }
    });
  }
}

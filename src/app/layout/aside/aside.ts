import { Component, computed, inject, input, output } from '@angular/core';
import { PanelMenu } from 'primeng/panelmenu';
import type { MenuItem } from 'primeng/api';
import { SessionStore } from '../../core/auth/session.store';
import { hasPermission } from '../../core/utils/has-permission';

/** Mapa entre un ítem del menú y el permiso o rol mínimo que lo habilita. */
interface NavItem extends MenuItem {
  /** Permiso requerido: "MÉTODO /ruta". Si está ausente se evalúan roles o es libre. */
  requiredPermission?: string;
  /** Roles permitidos. Si está presente, el usuario debe tener al menos uno. */
  requiredRoles?: string[];
  items?: NavItem[];
}

/** Ítems para usuarios Pasajeros */
const PASSENGER_ITEMS: NavItem[] = [
  {
    label: 'Pedir Carrera',
    icon: 'pi pi-fw pi-compass',
    routerLink: '/passenger/request',
    requiredPermission: 'POST /api/carreras/cotizar',
  },
  {
    label: 'Mis Carreras',
    icon: 'pi pi-fw pi-history',
    routerLink: '/passenger/trips',
    requiredPermission: 'GET /api/carreras/mis-carreras',
  },
];

/** Ítems para Conductores */
const DRIVER_ITEMS: NavItem[] = [
  {
    label: 'Panel Conductor',
    icon: 'pi pi-fw pi-car',
    routerLink: '/driver/panel',
    requiredPermission: 'GET /api/carreras/asignadas',
  },
];

/** Ítems para Despacho */
const DISPATCH_ITEMS: NavItem[] = [
  {
    label: 'Central de Despacho',
    icon: 'pi pi-fw pi-send',
    routerLink: '/dispatch',
    requiredPermission: 'GET /api/carreras/pendientes',
  },
];

/** Catálogo de gestión y administración operativa */
const OPERATION_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-fw pi-th-large', routerLink: '/dashboard' },
  { label: 'Pasajeros', icon: 'pi pi-fw pi-users', routerLink: '/passengers', requiredPermission: 'GET /api/pasajeros' },
  { label: 'Vehículos', icon: 'pi pi-fw pi-car', routerLink: '/vehicles', requiredPermission: 'GET /api/vehiculos' },
  { label: 'Empresas', icon: 'pi pi-fw pi-building', routerLink: '/companies', requiredPermission: 'GET /api/empresas' },
  { label: 'Tipos de Vehículo', icon: 'pi pi-fw pi-tags', routerLink: '/vehicle-types', requiredPermission: 'GET /api/tipos-vehiculo' },
  { label: 'Conductores', icon: 'pi pi-fw pi-id-card', routerLink: '/drivers', requiredPermission: 'GET /api/conductores' },
  { label: 'Turnos', icon: 'pi pi-fw pi-clock', routerLink: '/shifts', requiredPermission: 'GET /api/turnos' },
  { label: 'Tarifas', icon: 'pi pi-fw pi-dollar', routerLink: '/fares', requiredPermission: 'GET /api/tarifas' },
  { label: 'Carreras (Admin)', icon: 'pi pi-fw pi-list', routerLink: '/trips', requiredPermission: 'GET /api/carreras' },
  { label: 'Pagos', icon: 'pi pi-fw pi-wallet', routerLink: '/payments', requiredPermission: 'GET /api/pagos' },
  { label: 'Calificaciones', icon: 'pi pi-fw pi-star', routerLink: '/ratings', requiredPermission: 'GET /api/calificaciones' },
  { label: 'Liquidaciones', icon: 'pi pi-fw pi-calculator', routerLink: '/settlements', requiredPermission: 'GET /api/liquidaciones' },
  { label: 'Prototipo', icon: 'pi pi-fw pi-wrench', routerLink: '/construir' },
];

/** Catálogo de administración del sistema y control de acceso */
const ADMIN_ITEMS: NavItem[] = [
  { label: 'Seguridad y RBAC', icon: 'pi pi-fw pi-shield', routerLink: '/admin/rbac', requiredPermission: 'GET /api/usuarios' },
];

@Component({
  selector: 'app-aside',
  imports: [PanelMenu],
  styleUrl: './aside.css',
  templateUrl: './aside.html',
})
export class Aside {
  private readonly session = inject(SessionStore);

  readonly items = input<MenuItem[]>([]);
  navigated = output<void>();

  /** Ítems del menú dinámicamente filtrados según los permisos efectivos y roles */
  readonly filteredItems = computed<MenuItem[]>(() => {
    const permissions = this.session.permissions();

    const isAllowed = (item: NavItem): boolean => {
      // 1. Si requiere permiso HTTP granular
      if (item.requiredPermission) {
        const [method, ...pathParts] = item.requiredPermission.split(' ');
        if (hasPermission(permissions, method, pathParts.join(' '))) {
          return true;
        }
      }

      // 2. Si requiere roles específicos
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (item.requiredRoles.some((r) => this.session.hasRole(r))) {
          return true;
        }
      }

      // 3. Si no tiene ninguna restricción configurada
      return !item.requiredPermission && (!item.requiredRoles || item.requiredRoles.length === 0);
    };

    const allowedPassenger = PASSENGER_ITEMS.filter(isAllowed);
    const allowedDriver = DRIVER_ITEMS.filter(isAllowed);
    const allowedDispatch = DISPATCH_ITEMS.filter(isAllowed);
    const allowedOperation = OPERATION_ITEMS.filter(isAllowed);
    const allowedAdmin = ADMIN_ITEMS.filter(isAllowed);

    const menu: MenuItem[] = [];

    // Sección de Servicios de Transporte (Pasajeros)
    if (allowedPassenger.length > 0) {
      menu.push({
        label: 'Servicio Pasajero',
        icon: 'pi pi-fw pi-user',
        expanded: true,
        items: allowedPassenger,
      });
    }

    // Sección Conductor
    if (allowedDriver.length > 0) {
      menu.push({
        label: 'Conducción',
        icon: 'pi pi-fw pi-car',
        expanded: true,
        items: allowedDriver,
      });
    }

    // Sección Despacho
    if (allowedDispatch.length > 0) {
      menu.push({
        label: 'Despacho',
        icon: 'pi pi-fw pi-send',
        expanded: true,
        items: allowedDispatch,
      });
    }

    // Sección Administración Operativa
    if (allowedOperation.length > 0) {
      menu.push({
        label: 'Operación General',
        icon: 'pi pi-fw pi-th-large',
        expanded: this.session.isAdmin() || this.session.isDespacho(),
        items: allowedOperation,
      });
    }

    // Sección RBAC
    if (allowedAdmin.length > 0) {
      menu.push({
        label: 'Administración',
        icon: 'pi pi-fw pi-cog',
        expanded: false,
        items: allowedAdmin,
      });
    }

    return menu;
  });

  onNavigate() {
    this.navigated.emit();
  }
}

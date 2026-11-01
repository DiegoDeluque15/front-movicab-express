import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register').then((m) => m.Register),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'construir',
        loadComponent: () =>
          import('./features/construir/construir').then((m) => m.Construir),
      },
      {
        path: 'passengers',
        loadComponent: () =>
          import('./features/passengers/passenger-list').then((m) => m.PassengerList),
      },
      {
        path: 'passengers/new',
        loadComponent: () =>
          import('./features/passengers/passenger-form').then((m) => m.PassengerForm),
      },
      {
        path: 'passengers/:id/edit',
        loadComponent: () =>
          import('./features/passengers/passenger-form').then((m) => m.PassengerForm),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/vehicle-list').then((m) => m.VehicleList),
      },
      {
        path: 'vehicles/new',
        loadComponent: () =>
          import('./features/vehicles/vehicle-form').then((m) => m.VehicleForm),
      },
      {
        path: 'vehicles/:id/edit',
        loadComponent: () =>
          import('./features/vehicles/vehicle-form').then((m) => m.VehicleForm),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/company-list').then((m) => m.CompanyList),
      },
      {
        path: 'companies/new',
        loadComponent: () =>
          import('./features/companies/company-form').then((m) => m.CompanyForm),
      },
      {
        path: 'companies/:id/edit',
        loadComponent: () =>
          import('./features/companies/company-form').then((m) => m.CompanyForm),
      },
      {
        path: 'vehicle-types',
        loadComponent: () =>
          import('./features/vehicle-types/vehicle-type-list').then((m) => m.VehicleTypeList),
      },
      {
        path: 'vehicle-types/new',
        loadComponent: () =>
          import('./features/vehicle-types/vehicle-type-form').then((m) => m.VehicleTypeForm),
      },
      {
        path: 'vehicle-types/:id/edit',
        loadComponent: () =>
          import('./features/vehicle-types/vehicle-type-form').then((m) => m.VehicleTypeForm),
      },
      // ISS-05 — Conductores
      {
        path: 'drivers',
        loadComponent: () =>
          import('./features/drivers/driver-list').then((m) => m.DriverList),
      },
      {
        path: 'drivers/new',
        loadComponent: () =>
          import('./features/drivers/driver-form').then((m) => m.DriverForm),
      },
      {
        path: 'drivers/:id/edit',
        loadComponent: () =>
          import('./features/drivers/driver-form').then((m) => m.DriverForm),
      },
      // ISS-05 — Turnos
      {
        path: 'shifts',
        loadComponent: () =>
          import('./features/shifts/shift-list').then((m) => m.ShiftList),
      },
      {
        path: 'shifts/new',
        loadComponent: () =>
          import('./features/shifts/shift-form').then((m) => m.ShiftForm),
      },
      {
        path: 'shifts/:id/edit',
        loadComponent: () =>
          import('./features/shifts/shift-form').then((m) => m.ShiftForm),
      },
      // ISS-05 — Tarifas
      {
        path: 'fares',
        loadComponent: () =>
          import('./features/fares/fare-list').then((m) => m.FareList),
      },
      {
        path: 'fares/new',
        loadComponent: () =>
          import('./features/fares/fare-form').then((m) => m.FareForm),
      },
      {
        path: 'fares/:id/edit',
        loadComponent: () =>
          import('./features/fares/fare-form').then((m) => m.FareForm),
      },
      // Experiencia del Pasajero (Cotización, Solicitud e Historial)
      {
        path: 'passenger/request',
        loadComponent: () =>
          import('./features/passenger/trip-request/trip-request').then((m) => m.TripRequest),
      },
      {
        path: 'passenger/trips',
        loadComponent: () =>
          import('./features/passenger/passenger-trips/passenger-trips').then((m) => m.PassengerTrips),
      },
      // Experiencia del Conductor (Panel operativo y GPS)
      {
        path: 'driver/panel',
        loadComponent: () =>
          import('./features/driver/driver-panel/driver-panel').then((m) => m.DriverPanel),
      },
      // Central de Despacho (Asignación manual y monitoreo)
      {
        path: 'dispatch',
        loadComponent: () =>
          import('./features/dispatch/dispatch-panel/dispatch-panel').then((m) => m.DispatchPanel),
      },
      // Seguimiento en Tiempo Real (WebSocket /ws/tracking)
      {
        path: 'trips/:id/live',
        loadComponent: () =>
          import('./features/trips/trip-tracking-live/trip-tracking-live').then((m) => m.TripTrackingLive),
      },
      // ISS-06 — Carreras (Trips)
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trip-list').then((m) => m.TripList),
      },
      {
        path: 'trips/new',
        loadComponent: () =>
          import('./features/trips/trip-form').then((m) => m.TripForm),
      },
      {
        path: 'trips/:id',
        loadComponent: () =>
          import('./features/trips/trip-detail').then((m) => m.TripDetail),
      },
      // ISS-06 — Pagos (Payments)
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payment-list').then((m) => m.PaymentList),
      },
      {
        path: 'payments/new',
        loadComponent: () =>
          import('./features/payments/payment-form').then((m) => m.PaymentForm),
      },
      // ISS-06 — Calificaciones (Ratings)
      {
        path: 'ratings',
        loadComponent: () =>
          import('./features/ratings/rating-list').then((m) => m.RatingList),
      },
      {
        path: 'ratings/new',
        loadComponent: () =>
          import('./features/ratings/rating-form').then((m) => m.RatingForm),
      },
      // ISS-06 — Liquidaciones (Settlements)
      {
        path: 'settlements',
        loadComponent: () =>
          import('./features/settlements/settlement-list').then((m) => m.SettlementList),
      },
      {
        path: 'settlements/new',
        loadComponent: () =>
          import('./features/settlements/settlement-form').then((m) => m.SettlementForm),
      },
      // ISS-10 — Administración RBAC
      {
        path: 'admin/rbac',
        loadComponent: () =>
          import('./features/admin/rbac-admin').then((m) => m.RbacAdmin),
      },
    ],

  },
  { path: '**', redirectTo: '' },
];

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { InteractiveMap } from '../../../shared/ui/interactive-map/interactive-map';
import { TripApi } from '../../trips/trip-api';
import { DriverApi } from '../../drivers/driver-api';
import { SessionStore } from '../../../core/auth/session.store';
import { TrackingWsService } from '../../../core/services/tracking-ws.service';
import { DriverGpsService } from '../../../core/services/driver-gps.service';
import { Trip, TripStatus, TRIP_STATUS_LABEL } from '../../../core/models/trip.model';

@Component({
  selector: 'app-driver-panel',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    MessageModule,
    DialogModule,
    InputTextModule,
    PageHeader,
    EmptyState,
    InteractiveMap,
  ],
  templateUrl: './driver-panel.html',
  styleUrl: './driver-panel.css',
})
export class DriverPanel implements OnInit, OnDestroy {
  private readonly tripApi = inject(TripApi);
  private readonly driverApi = inject(DriverApi);
  private readonly session = inject(SessionStore);
  private readonly ws = inject(TrackingWsService);
  readonly gps = inject(DriverGpsService);
  private readonly messages = inject(MessageService);

  assignedTrips = signal<Trip[]>([]);
  activeTrip = signal<Trip | null>(null);
  loading = signal(true);
  isAvailable = signal(true);

  // Acciones en carrera
  actionLoading = signal(false);
  showCancelModal = signal(false);
  cancelReason = signal('');

  ngOnInit(): void {
    this.ws.connect();
    this.loadAssignedTrips();
  }

  ngOnDestroy(): void {
    this.gps.stopTracking();
  }

  loadAssignedTrips(autoRetry = true): void {
    this.loading.set(true);
    this.tripApi.getAssignedTrips().subscribe({
      next: (trips) => {
        this.assignedTrips.set(trips || []);
        this.loading.set(false);

        // Seleccionar automáticamente la primera carrera en curso o aceptada
        const current = trips.find((t) => t.status === 'en_curso') || trips[0] || null;
        this.selectTrip(current);
      },
      error: (err) => {
        // Si el usuario no tiene perfil de conductor asociado (404), auto-vincular de forma transparente
        if (err?.status === 404 && autoRetry) {
          this.autoLinkDriverProfile();
          return;
        }

        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron consultar las carreras asignadas.',
        });
      },
    });
  }

  /**
   * Auto-vinculación transparente: asocia el usuario actual a un conductor libre
   * o crea el perfil operativo automáticamente sin requerir intervención manual en la BD.
   */
  private autoLinkDriverProfile(): void {
    const user = this.session.user();
    if (!user?.id) {
      this.loading.set(false);
      return;
    }

    this.driverApi.list().subscribe({
      next: (drivers) => {
        const target = drivers.find((d) => !d.user_id) || drivers[0];
        if (target) {
          this.driverApi.update(target.id, { user_id: user.id, is_available: true }).subscribe({
            next: () => {
              this.messages.add({
                severity: 'info',
                summary: 'Perfil Vinculado Automáticamente',
                detail: `Tu cuenta ha sido vinculada al conductor "${target.name}".`,
              });
              this.loadAssignedTrips(false);
            },
            error: () => this.loading.set(false),
          });
        } else {
          this.driverApi.create({
            name: user.username ? `Conductor ${user.username}` : `Conductor ${user.id}`,
            description: 'Conductor auto-vinculado',
            status: 'active',
            user_id: user.id,
            is_available: true,
          }).subscribe({
            next: (created) => {
              this.messages.add({
                severity: 'success',
                summary: 'Perfil Creado Automáticamente',
                detail: `Se configuró el conductor operativo "${created.name}".`,
              });
              this.loadAssignedTrips(false);
            },
            error: () => this.loading.set(false),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  selectTrip(trip: Trip | null): void {
    this.activeTrip.set(trip);

    if (trip && (trip.status === 'aceptada' || trip.status === 'en_curso')) {
      this.ws.subscribeToTrip(trip.id);
      this.gps.startTracking(trip.id);
    } else {
      this.gps.stopTracking();
    }
  }

  // ── Gestión del Ciclo de Vida y Estados ──

  startTrip(trip: Trip): void {
    this.actionLoading.set(true);
    this.tripApi.changeStatus(trip.id, 'en_curso').subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.messages.add({
          severity: 'success',
          summary: 'Viaje en Curso',
          detail: `Has iniciado la carrera #${trip.id}. Conduce con precaución.`,
        });
        this.loadAssignedTrips();
      },
      error: (err) => {
        this.actionLoading.set(false);
        const msg = err?.error?.error || 'No se pudo iniciar el viaje.';
        this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  completeTrip(trip: Trip): void {
    this.actionLoading.set(true);
    this.tripApi.changeStatus(trip.id, 'cerrada').subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.gps.stopTracking();
        this.messages.add({
          severity: 'success',
          summary: 'Viaje Finalizado',
          detail: `Carrera #${trip.id} completada exitosamente. Total liquidado.`,
        });
        this.loadAssignedTrips();
      },
      error: (err) => {
        this.actionLoading.set(false);
        const msg = err?.error?.error || 'No se pudo finalizar la carrera.';
        this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  openCancelModal(): void {
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  confirmCancel(): void {
    const trip = this.activeTrip();
    if (!trip) return;

    this.actionLoading.set(true);
    this.tripApi.cancelTrip(trip.id, this.cancelReason().trim() || 'Cancelada por conductor').subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showCancelModal.set(false);
        this.gps.stopTracking();
        this.messages.add({
          severity: 'warn',
          summary: 'Carrera Cancelada',
          detail: `La carrera #${trip.id} fue cancelada.`,
        });
        this.loadAssignedTrips();
      },
      error: (err) => {
        this.actionLoading.set(false);
        const msg = err?.error?.error || 'No se pudo cancelar la carrera.';
        this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  getStatusLabel(status: TripStatus): string {
    return TRIP_STATUS_LABEL[status] || status;
  }
}

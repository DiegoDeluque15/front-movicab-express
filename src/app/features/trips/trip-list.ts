import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { TripApi } from './trip-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Trip, TripStatus, TRIP_TRANSITIONS, TRIP_STATUS_LABEL } from '../../core/models/trip.model';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-trip-list',
  imports: [
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    SelectModule,
    FormsModule,
    PageHeader,
    EmptyState,
    RouterLink,
    SharedModule,
    DecimalPipe,
    DatePipe,
    HasPermissionDirective,
  ],
  templateUrl: './trip-list.html',
})
export class TripList implements OnInit {
  private readonly api = inject(TripApi);
  private readonly confirm = inject(ConfirmationService);
  private readonly notify = inject(NotificationService);

  trips = signal<Trip[]>([]);
  loading = signal(true);

  // Modal para cambio de estado
  statusDialogVisible = signal(false);
  selectedTrip = signal<Trip | null>(null);
  selectedNewStatus = signal<TripStatus | null>(null);
  availableTransitions = signal<{ label: string; value: TripStatus }[]>([]);
  statusChanging = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data: Trip[]) => {
        this.trips.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar la lista de carreras');
        this.loading.set(false);
      },
    });
  }

  getStatusSeverity(status: TripStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'solicitada':
        return 'warn';
      case 'aceptada':
        return 'info';
      case 'en_curso':
        return 'secondary';
      case 'cerrada':
        return 'success';
      case 'cancelada':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: TripStatus): string {
    return TRIP_STATUS_LABEL[status] ?? status;
  }

  openStatusModal(trip: Trip): void {
    const nextStates = TRIP_TRANSITIONS[trip.status] || [];
    if (nextStates.length === 0) {
      this.notify.warn(`La carrera ya está en estado final (${this.getStatusLabel(trip.status)}).`);
      return;
    }

    this.selectedTrip.set(trip);
    this.availableTransitions.set(
      nextStates.map((s) => ({ label: TRIP_STATUS_LABEL[s], value: s }))
    );
    this.selectedNewStatus.set(nextStates[0]);
    this.statusDialogVisible.set(true);
  }

  confirmStatusChange(): void {
    const trip = this.selectedTrip();
    const newStatus = this.selectedNewStatus();
    if (!trip || !newStatus) return;

    this.statusChanging.set(true);
    this.api.changeStatus(trip.id, newStatus).subscribe({
      next: () => {
        this.notify.success(`Estado actualizado a "${TRIP_STATUS_LABEL[newStatus]}"`);
        this.statusDialogVisible.set(false);
        this.statusChanging.set(false);
        this.load();
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'Transición no permitida (409)';
        this.notify.error(detail);
        this.statusChanging.set(false);
      },
    });
  }

  confirmDelete(trip: Trip): void {
    this.confirm.confirm({
      message: `¿Eliminar la carrera #${trip.id}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      accept: () => this.delete(trip.id),
    });
  }

  private delete(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.notify.success('Carrera eliminada correctamente');
        this.load();
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar la carrera.';
        this.notify.error(detail);
      },
    });
  }
}


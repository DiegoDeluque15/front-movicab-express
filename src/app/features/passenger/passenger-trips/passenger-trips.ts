import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { TripApi } from '../../trips/trip-api';
import { Trip, TripStatus, TRIP_STATUS_LABEL } from '../../../core/models/trip.model';

interface FilterOption {
  label: string;
  value: TripStatus | 'all';
}

@Component({
  selector: 'app-passenger-trips',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    PageHeader,
    EmptyState,
  ],
  templateUrl: './passenger-trips.html',
  styleUrl: './passenger-trips.css',
})
export class PassengerTrips implements OnInit {
  private readonly tripApi = inject(TripApi);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  trips = signal<Trip[]>([]);
  loading = signal(true);
  selectedFilter = signal<TripStatus | 'all'>('all');

  // Cancelación modal
  showCancelModal = signal(false);
  cancellingTrip = signal<Trip | null>(null);
  cancelReason = signal('');
  isCancelling = signal(false);

  readonly filterOptions: FilterOption[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendientes', value: 'solicitada' },
    { label: 'Aceptadas', value: 'aceptada' },
    { label: 'En Curso', value: 'en_curso' },
    { label: 'Finalizadas', value: 'cerrada' },
    { label: 'Canceladas', value: 'cancelada' },
  ];

  readonly filteredTrips = computed(() => {
    const filter = this.selectedFilter();
    const list = this.trips();
    if (filter === 'all') return list;
    return list.filter((t) => t.status === filter);
  });

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading.set(true);
    this.tripApi.getMyTrips().subscribe({
      next: (data) => {
        this.trips.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar tus carreras.',
        });
      },
    });
  }

  getStatusSeverity(status: TripStatus): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
    switch (status) {
      case 'solicitada':
        return 'warn';
      case 'aceptada':
        return 'info';
      case 'en_curso':
        return 'success';
      case 'cerrada':
        return 'secondary';
      case 'cancelada':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: TripStatus): string {
    return TRIP_STATUS_LABEL[status] || status;
  }

  openCancelModal(trip: Trip): void {
    this.cancellingTrip.set(trip);
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  confirmCancel(): void {
    const trip = this.cancellingTrip();
    if (!trip) return;

    this.isCancelling.set(true);
    this.tripApi.cancelTrip(trip.id, this.cancelReason().trim() || undefined).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.showCancelModal.set(false);
        this.messages.add({
          severity: 'success',
          summary: 'Cancelada',
          detail: `La carrera #${trip.id} ha sido cancelada.`,
        });
        this.loadTrips();
      },
      error: (err) => {
        this.isCancelling.set(false);
        const msg = err?.error?.error || 'No se pudo cancelar la carrera.';
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
        });
      },
    });
  }

  trackTrip(tripId: number): void {
    this.router.navigate(['/trips', tripId, 'live']);
  }
}


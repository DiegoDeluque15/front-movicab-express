import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, UpperCasePipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TripApi } from './trip-api';
import { PaymentApi } from '../payments/payment-api';
import { RatingApi } from '../ratings/rating-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Trip, TripStatus, TRIP_TRANSITIONS, TRIP_STATUS_LABEL } from '../../core/models/trip.model';
import { Payment } from '../../core/models/payment.model';
import { Rating } from '../../core/models/rating.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-trip-detail',
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    CardModule,
    RatingModule,
    DialogModule,
    SelectModule,
    FormsModule,
    PageHeader,
    RouterLink,
    DecimalPipe,
    DatePipe,
    UpperCasePipe,
  ],
  templateUrl: './trip-detail.html',
})
export class TripDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripApi = inject(TripApi);
  private readonly paymentApi = inject(PaymentApi);
  private readonly ratingApi = inject(RatingApi);
  private readonly notify = inject(NotificationService);

  tripId: number | null = null;
  trip = signal<Trip | null>(null);
  payment = signal<Payment | null>(null);
  rating = signal<Rating | null>(null);
  loading = signal(true);

  // Modal para cambio de estado
  statusDialogVisible = signal(false);
  selectedNewStatus = signal<TripStatus | null>(null);
  availableTransitions = signal<{ label: string; value: TripStatus }[]>([]);
  statusChanging = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/trips']);
      return;
    }
    this.tripId = +idParam;
    this.loadData();
  }

  loadData(): void {
    if (!this.tripId) return;
    this.loading.set(true);

    forkJoin({
      trip: this.tripApi.get(this.tripId),
      payments: this.paymentApi.list(),
      ratings: this.ratingApi.list(),
    }).subscribe({
      next: ({ trip, payments, ratings }) => {
        this.trip.set(trip);

        // Buscar pago asociado
        const foundPayment = payments.find(
          (p) => Number(p.reference_id) === this.tripId
        );
        this.payment.set(foundPayment || null);

        // Buscar calificación asociada
        const foundRating = ratings.find((r) => r.trip_id === this.tripId);
        this.rating.set(foundRating || null);

        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar detalle del viaje');
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

  openStatusModal(): void {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    const nextStates = TRIP_TRANSITIONS[currentTrip.status] || [];
    if (nextStates.length === 0) {
      this.notify.warn('La carrera ya se encuentra en estado final');
      return;
    }

    this.availableTransitions.set(
      nextStates.map((s) => ({ label: TRIP_STATUS_LABEL[s], value: s }))
    );
    this.selectedNewStatus.set(nextStates[0]);
    this.statusDialogVisible.set(true);
  }

  confirmStatusChange(): void {
    if (!this.tripId || !this.selectedNewStatus()) return;

    this.statusChanging.set(true);
    this.tripApi.changeStatus(this.tripId, this.selectedNewStatus()!).subscribe({
      next: () => {
        this.notify.success('Estado actualizado correctamente');
        this.statusDialogVisible.set(false);
        this.statusChanging.set(false);
        this.loadData();
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al cambiar estado';
        this.notify.error(detail);
        this.statusChanging.set(false);
      },
    });
  }
}


import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { SharedModule } from 'primeng/api';
import { TripApi } from '../trips/trip-api';
import { PaymentApi } from '../payments/payment-api';
import { RatingApi } from '../ratings/rating-api';
import { DriverApi } from '../drivers/driver-api';
import { VehicleApi } from '../vehicles/vehicle-api';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DashboardStats } from '../../core/models/dashboard.model';
import { Trip, TripStatus, TRIP_STATUS_LABEL } from '../../core/models/trip.model';
import { Payment } from '../../core/models/payment.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    RatingModule,
    SharedModule,
    PageHeader,
    RouterLink,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly tripApi = inject(TripApi);
  private readonly paymentApi = inject(PaymentApi);
  private readonly ratingApi = inject(RatingApi);
  private readonly driverApi = inject(DriverApi);
  private readonly vehicleApi = inject(VehicleApi);

  loading = signal(true);
  stats = signal<DashboardStats>({
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    cancelledTrips: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalRatings: 0,
    activeDrivers: 0,
    activeVehicles: 0,
  });

  recentTrips = signal<Trip[]>([]);
  recentPayments = signal<Payment[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    forkJoin({
      trips: this.tripApi.list(),
      payments: this.paymentApi.list(),
      ratings: this.ratingApi.list(),
      drivers: this.driverApi.list(),
      vehicles: this.vehicleApi.list(),
    }).subscribe({
      next: ({ trips, payments, ratings, drivers, vehicles }) => {
        // Calcular estadísticas
        const completedTrips = trips.filter((t) => t.status === 'cerrada').length;
        const activeTrips = trips.filter(
          (t) => t.status === 'en_curso' || t.status === 'aceptada' || t.status === 'solicitada'
        ).length;
        const cancelledTrips = trips.filter((t) => t.status === 'cancelada').length;

        const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

        const ratingSum = ratings.reduce((acc, r) => acc + Number(r.score || 0), 0);
        const averageRating = ratings.length > 0 ? ratingSum / ratings.length : 0;

        const activeDrivers = drivers.filter((d) => d.status === 'active').length;
        const activeVehicles = vehicles.filter((v) => v.status === 'active').length;

        this.stats.set({
          totalTrips: trips.length,
          completedTrips,
          activeTrips,
          cancelledTrips,
          totalRevenue,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length,
          activeDrivers,
          activeVehicles,
        });

        // Últimos 5 viajes
        this.recentTrips.set(trips.slice(-5).reverse());
        // Últimos 5 pagos
        this.recentPayments.set(payments.slice(-5).reverse());

        this.loading.set(false);
      },
      error: () => {
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
}


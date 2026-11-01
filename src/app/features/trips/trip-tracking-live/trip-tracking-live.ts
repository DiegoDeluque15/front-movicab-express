import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { InteractiveMap } from '../../../shared/ui/interactive-map/interactive-map';
import { TripApi } from '../trip-api';
import { TrackingWsService } from '../../../core/services/tracking-ws.service';
import { Trip, TripStatus, TRIP_STATUS_LABEL } from '../../../core/models/trip.model';
import { TrackingStatusResponse } from '../../../core/models/tracking.model';

@Component({
  selector: 'app-trip-tracking-live',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    CardModule,
    MessageModule,
    PageHeader,
    InteractiveMap,
  ],
  templateUrl: './trip-tracking-live.html',
  styleUrl: './trip-tracking-live.css',
})
export class TripTrackingLive implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripApi = inject(TripApi);
  readonly ws = inject(TrackingWsService);
  private readonly messages = inject(MessageService);

  tripId = signal<number>(0);
  trip = signal<Trip | null>(null);
  tracking = signal<TrackingStatusResponse | null>(null);
  loading = signal(true);

  // Ubicación dinámica del conductor
  currentDriverLocation = signal<{ lat: number; lng: number; heading?: number | null } | null>(null);

  private locationSub?: Subscription;
  private statusSub?: Subscription;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!id) {
      this.router.navigate(['/trips']);
      return;
    }

    this.tripId.set(id);
    this.loadTripAndTracking(id);
    this.setupWebSocket(id);
  }

  ngOnDestroy(): void {
    const id = this.tripId();
    if (id) {
      this.ws.unsubscribeFromTrip(id);
    }
    this.locationSub?.unsubscribe();
    this.statusSub?.unsubscribe();
  }

  private loadTripAndTracking(id: number): void {
    this.loading.set(true);

    this.tripApi.get(id).subscribe({
      next: (tripData) => {
        this.trip.set(tripData);

        this.tripApi.getTracking(id).subscribe({
          next: (trackingData) => {
            this.tracking.set(trackingData);
            if (trackingData.last_location) {
              this.currentDriverLocation.set({
                lat: Number(trackingData.last_location.lat),
                lng: Number(trackingData.last_location.lng),
                heading: trackingData.last_location.heading,
              });
            }
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la carrera.',
        });
      },
    });
  }

  private setupWebSocket(id: number): void {
    this.ws.connect();
    this.ws.subscribeToTrip(id);

    // Escuchar actualizaciones de ubicación del conductor
    this.locationSub = this.ws.getLocationUpdatesForTrip(id).subscribe((loc) => {
      this.currentDriverLocation.set({
        lat: Number(loc.lat),
        lng: Number(loc.lng),
        heading: loc.heading,
      });
    });

    // Escuchar cambios de estado en vivo
    this.statusSub = this.ws.getStatusChangesForTrip(id).subscribe((event) => {
      const current = this.trip();
      if (current) {
        this.trip.set({
          ...current,
          status: event.new_status as TripStatus,
        });
      }

      this.messages.add({
        severity: 'info',
        summary: 'Estado Actualizado',
        detail: `La carrera ha cambiado a: ${this.getStatusLabel(event.new_status as TripStatus)}`,
      });
    });
  }

  getStatusLabel(status: TripStatus): string {
    return TRIP_STATUS_LABEL[status] || status;
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
}


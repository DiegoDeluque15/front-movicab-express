import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { InteractiveMap } from '../../../shared/ui/interactive-map/interactive-map';
import { TripApi } from '../../trips/trip-api';
import { GeoCoordinates, Trip, TripQuotation, TripRequestResponse } from '../../../core/models/trip.model';

interface PresetLocation {
  name: string;
  coords: GeoCoordinates;
}

@Component({
  selector: 'app-trip-request',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    CardModule,
    MessageModule,
    TagModule,
    DialogModule,
    PageHeader,
    InteractiveMap,
  ],
  templateUrl: './trip-request.html',
  styleUrl: './trip-request.css',
})
export class TripRequest {
  private readonly tripApi = inject(TripApi);
  private readonly router = inject(Router);

  // Coordenadas seleccionadas
  origin = signal<GeoCoordinates>({
    lat: 4.6534,
    lng: -74.0836,
    address: 'Parque Simón Bolívar, Bogotá',
  });

  destination = signal<GeoCoordinates>({
    lat: 4.6989,
    lng: -74.0322,
    address: 'Parque de la 93, Bogotá',
  });

  notes = signal('');

  // Estados de proceso
  isQuoting = signal(false);
  isRequesting = signal(false);
  quoteError = signal<string | null>(null);
  requestError = signal<string | null>(null);

  // Cotización activa devuelta por el backend
  activeQuotation = signal<TripQuotation | null>(null);

  // Resultado de solicitud
  requestResult = signal<TripRequestResponse | null>(null);
  showSuccessModal = signal(false);

  // Puntos de referencia populares en Bogotá
  readonly presets: PresetLocation[] = [
    { name: 'Aeropuerto El Dorado', coords: { lat: 4.7016, lng: -74.1469, address: 'Aeropuerto El Dorado, Bogotá' } },
    { name: 'Centro / Plaza de Bolívar', coords: { lat: 4.5981, lng: -74.076, address: 'Plaza de Bolívar, Centro' } },
    { name: 'Parque de la 93', coords: { lat: 4.6989, lng: -74.0322, address: 'Parque de la 93, Chapinero' } },
    { name: 'Unicentro Bogotá', coords: { lat: 4.7011, lng: -74.0416, address: 'Centro Comercial Unicentro' } },
    { name: 'Portal Norte TransMilenio', coords: { lat: 4.7551, lng: -74.0456, address: 'Portal Norte, Autopista Norte' } },
  ];

  onOriginFromMap(coords: GeoCoordinates): void {
    this.origin.set(coords);
    this.activeQuotation.set(null); // Invalidar cotización anterior si cambia punto
  }

  onDestinationFromMap(coords: GeoCoordinates): void {
    this.destination.set(coords);
    this.activeQuotation.set(null);
  }

  applyPreset(type: 'origin' | 'destination', preset: PresetLocation): void {
    if (type === 'origin') {
      this.origin.set(preset.coords);
    } else {
      this.destination.set(preset.coords);
    }
    this.activeQuotation.set(null);
  }

  /** Solicitar cotización formal al backend */
  getQuote(): void {
    this.quoteError.set(null);
    this.requestError.set(null);
    this.isQuoting.set(true);

    const orig = this.origin();
    const dest = this.destination();

    if (!orig || !dest) {
      this.quoteError.set('Debes seleccionar tanto el origen como el destino.');
      this.isQuoting.set(false);
      return;
    }

    this.tripApi
      .quote({
        origin: orig,
        destination: dest,
      })
      .subscribe({
        next: (quotation) => {
          this.activeQuotation.set(quotation);
          this.isQuoting.set(false);
        },
        error: (err) => {
          this.isQuoting.set(false);
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            'Error al calcular la cotización. Verifica las coordenadas.';
          this.quoteError.set(msg);
        },
      });
  }

  /** Confirmar y solicitar carrera usando el quote_token */
  submitTripRequest(): void {
    const quotation = this.activeQuotation();
    if (!quotation) {
      this.requestError.set('Debes obtener una cotización antes de solicitar la carrera.');
      return;
    }

    if (this.isRequesting()) return; // Prevenir clics repetidos

    this.isRequesting.set(true);
    this.requestError.set(null);

    this.tripApi
      .requestTrip({
        quote_token: quotation.quote_token,
        notes: this.notes().trim() || null,
      })
      .subscribe({
        next: (res) => {
          this.isRequesting.set(false);
          this.requestResult.set(res);
          this.showSuccessModal.set(true);
        },
        error: (err) => {
          this.isRequesting.set(false);
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            'Error al solicitar carrera. Por favor intenta de nuevo.';
          this.requestError.set(msg);
        },
      });
  }

  goToTracking(tripId: number): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/trips', tripId, 'live']);
  }

  goToMyTrips(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/passenger/trips']);
  }
}


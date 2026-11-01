import { Injectable, inject, signal } from '@angular/core';
import { TripApi } from '../../features/trips/trip-api';
import { TrackingWsService } from './tracking-ws.service';

export interface DriverGpsLocation {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
  timestamp: number;
}

export type GpsSignalState = 'idle' | 'active' | 'denied' | 'unavailable' | 'weak_signal';

@Injectable({ providedIn: 'root' })
export class DriverGpsService {
  private readonly tripApi = inject(TripApi);
  private readonly ws = inject(TrackingWsService);

  private watchId: number | null = null;
  private currentTripId: number | null = null;
  private lastSentTime = 0;
  private lastSentLocation: DriverGpsLocation | null = null;

  // Límite de frecuencia: mínimo 2500ms (el backend exige >= 2000ms en TrackingService)
  private readonly MIN_INTERVAL_MS = 2500;
  // Umbral de distancia mínima (en metros) para evitar publicar coordenadas estacionarias repetidas
  private readonly MIN_DISTANCE_METERS = 3;

  readonly gpsState = signal<GpsSignalState>('idle');
  readonly currentLocation = signal<DriverGpsLocation | null>(null);
  readonly accuracyMeters = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Inicia la captura continua de geolocalización para una carrera activa.
   */
  startTracking(tripId: number): void {
    if (this.currentTripId === tripId && this.watchId !== null) {
      return;
    }

    this.stopTracking();
    this.currentTripId = tripId;
    this.errorMessage.set(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.gpsState.set('unavailable');
      this.errorMessage.set('Geolocalización no soportada por el navegador.');
      return;
    }

    this.gpsState.set('active');

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => this.handlePositionError(err),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );
  }

  /**
   * Detiene inmediatamente la captura de GPS y libera los recursos del sensor.
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentTripId = null;
    this.gpsState.set('idle');
  }

  private handlePositionUpdate(pos: GeolocationPosition): void {
    const lat = Number(pos.coords.latitude.toFixed(6));
    const lng = Number(pos.coords.longitude.toFixed(6));
    const accuracy = Math.round(pos.coords.accuracy);
    const heading = pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Number(pos.coords.heading.toFixed(1)) : null;
    const speed = pos.coords.speed !== null && !isNaN(pos.coords.speed) ? Number(pos.coords.speed.toFixed(1)) : null;
    const timestamp = pos.timestamp || Date.now();

    // Validar coordenadas dentro del rango geográfico válido
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Coordenadas GPS anómalas ignoradas:', { lat, lng });
      return;
    }

    const loc: DriverGpsLocation = { lat, lng, heading, speed, accuracy, timestamp };
    this.currentLocation.set(loc);
    this.accuracyMeters.set(accuracy);

    // Detección de señal débil (precisión mayor a 50 metros)
    if (accuracy > 50) {
      this.gpsState.set('weak_signal');
    } else {
      this.gpsState.set('active');
    }

    // Comprobar control de frecuencia y cambio de posición
    const now = Date.now();
    const timeElapsed = now - this.lastSentTime;

    if (timeElapsed >= this.MIN_INTERVAL_MS) {
      if (this.shouldPublish(loc)) {
        this.publishLocation(loc);
        this.lastSentTime = now;
        this.lastSentLocation = loc;
      }
    }
  }

  private shouldPublish(loc: DriverGpsLocation): boolean {
    if (!this.lastSentLocation) return true;

    // Calcular desplazamiento respecto a la última emitida
    const dist = this.haversineMeters(this.lastSentLocation, loc);
    // Enviar si se movió más del umbral o si cambió de rumbo
    return dist >= this.MIN_DISTANCE_METERS || (loc.heading !== null && loc.heading !== this.lastSentLocation.heading);
  }

  private publishLocation(loc: DriverGpsLocation): void {
    const tripId = this.currentTripId;
    if (!tripId) return;

    // 1. Emisión en tiempo real ultra-rápida vía WebSocket
    this.ws.publishDriverLocation(tripId, loc.lat, loc.lng, loc.heading, loc.speed);

    // 2. Persistencia en base de datos del backend
    this.tripApi
      .recordLocation(tripId, {
        lat: loc.lat,
        lng: loc.lng,
        heading: loc.heading,
        speed: loc.speed,
        recorded_at: new Date(loc.timestamp).toISOString(),
      })
      .subscribe({
        error: (err) => console.warn('Error al persistir GPS en backend:', err?.message),
      });
  }

  private handlePositionError(err: GeolocationPositionError): void {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        this.gpsState.set('denied');
        this.errorMessage.set('Permiso de GPS denegado por el usuario.');
        break;
      case err.POSITION_UNAVAILABLE:
        this.gpsState.set('unavailable');
        this.errorMessage.set('Señal de GPS no disponible en este momento.');
        break;
      case err.TIMEOUT:
        this.gpsState.set('weak_signal');
        this.errorMessage.set('Tiempo de espera agotado al consultar satélites GPS.');
        break;
      default:
        this.errorMessage.set(err.message || 'Error desconocido de geolocalización.');
    }
  }

  private haversineMeters(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371000; // metros
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}


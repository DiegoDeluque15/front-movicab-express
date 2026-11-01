import { Injectable, inject, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../auth/session.store';
import {
  WsLocationUpdatedEvent,
  WsStatusChangedEvent,
  WsLocationAckEvent,
  WsErrorEvent,
  WsAuthenticatedEvent,
} from '../models/tracking.model';

@Injectable({ providedIn: 'root' })
export class TrackingWsService {
  private readonly session = inject(SessionStore);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: any = null;
  private subscribedTripIds = new Set<number>();

  readonly connectionStatus = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  readonly isAuthenticated = signal(false);

  private readonly locationSubject = new Subject<WsLocationUpdatedEvent>();
  private readonly statusSubject = new Subject<WsStatusChangedEvent>();
  private readonly ackSubject = new Subject<WsLocationAckEvent>();
  private readonly errorSubject = new Subject<WsErrorEvent>();

  /** Stream observable de actualizaciones GPS de conductores */
  readonly locationUpdates$: Observable<WsLocationUpdatedEvent> = this.locationSubject.asObservable();

  /** Stream observable de cambios de estado en carreras */
  readonly statusChanges$: Observable<WsStatusChangedEvent> = this.statusSubject.asObservable();

  /** Confirmación de recepción de ubicación */
  readonly locationAck$: Observable<WsLocationAckEvent> = this.ackSubject.asObservable();

  /** Errores reportados por el socket */
  readonly errors$: Observable<WsErrorEvent> = this.errorSubject.asObservable();

  /**
   * Conecta al servidor WebSocket e inicia el handshake de autenticación
   * seguro mediante mensaje de protocolo (sin pasar JWT en la URL).
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.session.token();
    if (!token) {
      this.connectionStatus.set('disconnected');
      return;
    }

    this.connectionStatus.set('connecting');

    try {
      this.ws = new WebSocket(environment.wsUrl);

      this.ws.onopen = () => {
        this.connectionStatus.set('connected');
        this.reconnectAttempts = 0;

        // Protocolo de autenticación en payload JSON
        this.send({
          type: 'auth',
          token: this.session.token(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.warn('Error al parsear mensaje WS:', err);
        }
      };

      this.ws.onerror = () => {
        this.connectionStatus.set('error');
      };

      this.ws.onclose = (event) => {
        this.isAuthenticated.set(false);
        this.connectionStatus.set('disconnected');
        this.ws = null;

        // Si fue un cierre por fallo de autenticación (código 4001 del backend), no reintentamos
        if (event.code === 4001) {
          console.warn('Conexión WS cerrada por credenciales inválidas (4001).');
          return;
        }

        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('Error al inicializar WebSocket:', err);
      this.connectionStatus.set('error');
      this.scheduleReconnect();
    }
  }

  /** Suscribe el socket al canal de seguimiento de una carrera */
  subscribeToTrip(tripId: number): void {
    this.subscribedTripIds.add(tripId);
    if (this.isAuthenticated()) {
      this.send({
        type: 'subscribe',
        trip_id: tripId,
      });
    } else {
      // Conectar primero si aún no está conectado
      this.connect();
    }
  }

  /** Cancela la suscripción a una carrera */
  unsubscribeFromTrip(tripId: number): void {
    this.subscribedTripIds.delete(tripId);
    if (this.isAuthenticated()) {
      this.send({
        type: 'unsubscribe',
        trip_id: tripId,
      });
    }
  }

  /** Conductor publica su posición GPS en vivo */
  publishDriverLocation(
    tripId: number,
    lat: number,
    lng: number,
    heading?: number | null,
    speed?: number | null
  ): void {
    if (!this.isAuthenticated()) return;

    this.send({
      type: 'publish_location',
      trip_id: tripId,
      lat,
      lng,
      heading: heading ?? null,
      speed: speed ?? null,
    });
  }

  /** Filtrar actualizaciones de ubicación específicas para una carrera */
  getLocationUpdatesForTrip(tripId: number): Observable<WsLocationUpdatedEvent> {
    return this.locationUpdates$.pipe(filter((e) => e.trip_id === tripId));
  }

  /** Filtrar cambios de estado específicos para una carrera */
  getStatusChangesForTrip(tripId: number): Observable<WsStatusChangedEvent> {
    return this.statusChanges$.pipe(filter((e) => e.trip_id === tripId));
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.subscribedTripIds.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated.set(false);
    this.connectionStatus.set('disconnected');
  }

  private send(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private handleIncomingMessage(data: any): void {
    switch (data.event) {
      case 'authenticated':
        this.isAuthenticated.set(true);
        // Resuscribir a las carreras pendientes
        for (const tripId of this.subscribedTripIds) {
          this.send({ type: 'subscribe', trip_id: tripId });
        }
        break;

      case 'location_updated':
        this.locationSubject.next(data as WsLocationUpdatedEvent);
        break;

      case 'status_changed':
        this.statusSubject.next(data as WsStatusChangedEvent);
        break;

      case 'location_ack':
        this.ackSubject.next(data as WsLocationAckEvent);
        break;

      case 'error':
      case 'auth_failed':
        this.errorSubject.next(data as WsErrorEvent);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}


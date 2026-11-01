import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Trip,
  TripCreatePayload,
  TripQuotation,
  TripRequestPayload,
  TripRequestResponse,
  TripStatus,
  TripUpdatePayload,
  QuoteRequestPayload,
  QuoteResponse,
} from '../../core/models/trip.model';
import { AvailableResourcesResponse, ManualAssignPayload, ManualAssignResponse } from '../../core/models/dispatch.model';
import { RecordLocationPayload, TrackingStatusResponse } from '../../core/models/tracking.model';

@Injectable({ providedIn: 'root' })
export class TripApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/carreras`;
  private readonly despachoBase = `${environment.apiUrl}/despacho`;

  // ── Cotización y Solicitud ──

  quote(payload: QuoteRequestPayload): Observable<TripQuotation> {
    return this.http.post<QuoteResponse>(`${this.base}/cotizar`, payload).pipe(map((r) => r.quotation));
  }

  requestTrip(payload: TripRequestPayload): Observable<TripRequestResponse> {
    return this.http.post<TripRequestResponse>(`${this.base}/solicitar`, payload);
  }

  // ── Vistas por Rol ──

  getMyTrips(): Observable<Trip[]> {
    return this.http.get<{ trips: Trip[] }>(`${this.base}/mis-carreras`).pipe(map((r) => r.trips));
  }

  getAssignedTrips(): Observable<Trip[]> {
    return this.http.get<{ trips: Trip[] }>(`${this.base}/asignadas`).pipe(map((r) => r.trips));
  }

  getPendingTrips(): Observable<Trip[]> {
    return this.http.get<{ trips: Trip[] }>(`${this.base}/pendientes`).pipe(map((r) => r.trips));
  }

  // ── Despacho y Asignación Manual ──

  getAvailableResources(): Observable<AvailableResourcesResponse> {
    return this.http.get<AvailableResourcesResponse>(`${this.despachoBase}/recursos-disponibles`);
  }

  assignManual(id: number, payload: ManualAssignPayload): Observable<ManualAssignResponse> {
    return this.http.post<ManualAssignResponse>(`${this.base}/${id}/asignar-manual`, payload);
  }

  // ── Ciclo de Vida y Estados ──

  cancelTrip(id: number, reason?: string): Observable<Trip> {
    return this.http.patch<{ message: string; trip: Trip }>(`${this.base}/${id}/cancelar`, { reason }).pipe(
      map((r) => r.trip)
    );
  }

  changeStatus(id: number, status: TripStatus): Observable<Trip> {
    return this.http.patch<{ trip: Trip }>(`${this.base}/${id}/estado`, { status }).pipe(map((r) => r.trip));
  }

  // ── Geolocalización y Seguimiento ──

  recordLocation(id: number, payload: RecordLocationPayload): Observable<{ message: string; location: any }> {
    return this.http.post<{ message: string; location: any }>(`${this.base}/${id}/ubicacion`, payload);
  }

  getTracking(id: number): Observable<TrackingStatusResponse> {
    return this.http.get<{ tracking: TrackingStatusResponse }>(`${this.base}/${id}/seguimiento`).pipe(
      map((r) => r.tracking)
    );
  }

  // ── CRUD Base / Administrativo ──

  list(): Observable<Trip[]> {
    return this.http.get<{ trips: Trip[] }>(this.base).pipe(map((r) => r.trips));
  }

  get(id: number): Observable<Trip> {
    return this.http.get<{ trip: Trip }>(`${this.base}/${id}`).pipe(map((r) => r.trip));
  }

  create(payload: TripCreatePayload): Observable<Trip> {
    return this.http.post<{ trip: Trip }>(this.base, payload).pipe(map((r) => r.trip));
  }

  update(id: number, payload: TripUpdatePayload): Observable<Trip> {
    return this.http.patch<{ trip: Trip }>(`${this.base}/${id}`, payload).pipe(map((r) => r.trip));
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

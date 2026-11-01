import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TripApi } from './trip-api';

const BASE = `${environment.apiUrl}/carreras`;

describe('TripApi', () => {
  let api: TripApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TripApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should post to /cotizar and return quotation object', () => {
    const payload = {
      origin: { lat: 4.6534, lng: -74.0836 },
      destination: { lat: 4.6989, lng: -74.0322 },
    };

    api.quote(payload).subscribe((quote) => {
      expect(quote.quote_token).toBe('QUOTE-TEST-123');
      expect(quote.pricing.estimated_price).toBe(15000);
    });

    const req = http.expectOne(`${BASE}/cotizar`);
    expect(req.request.method).toBe('POST');
    req.flush({
      quotation: {
        quote_token: 'QUOTE-TEST-123',
        pricing: { estimated_price: 15000, base_value: 5000, distance_cost: 10000, minimum_fare: 5000, price_per_km: 1500 },
        route: { distance_km: 6.5, duration_min: 18, is_real_route: false, provider: 'Haversine' },
        fare: { id: 1, name: 'Tarifa Estándar', base_value: 5000, price_per_km: 1500, minimum_fare: 5000 },
        expires_at: new Date().toISOString(),
      },
    });
  });

  it('should post to /solicitar and return TripRequestResponse', () => {
    const payload = { quote_token: 'QUOTE-TEST-123', notes: 'Piso 2' };

    api.requestTrip(payload).subscribe((res) => {
      expect(res.trip.id).toBe(42);
      expect(res.assignment.assigned).toBe(true);
    });

    const req = http.expectOne(`${BASE}/solicitar`);
    expect(req.request.method).toBe('POST');
    req.flush({
      message: 'Carrera solicitada exitosamente',
      trip: { id: 42, status: 'aceptada' },
      assignment: { success: true, assigned: true, type: 'auto', driver_name: 'Juan Perez' },
    });
  });

  it('should get /mis-carreras and unwrap trips', () => {
    api.getMyTrips().subscribe((trips) => {
      expect(trips.length).toBe(1);
      expect(trips[0].id).toBe(10);
    });

    const req = http.expectOne(`${BASE}/mis-carreras`);
    expect(req.request.method).toBe('GET');
    req.flush({ trips: [{ id: 10, status: 'solicitada' }] });
  });

  it('should get /asignadas and unwrap trips', () => {
    api.getAssignedTrips().subscribe((trips) => {
      expect(trips.length).toBe(1);
      expect(trips[0].status).toBe('en_curso');
    });

    const req = http.expectOne(`${BASE}/asignadas`);
    expect(req.request.method).toBe('GET');
    req.flush({ trips: [{ id: 11, status: 'en_curso' }] });
  });

  it('should post /:id/asignar-manual for dispatch assignment', () => {
    const payload = { driver_id: 5, vehicle_id: 3, notes: 'Despacho prioritario' };

    api.assignManual(15, payload).subscribe((res) => {
      expect(res.message).toBe('Asignación manual exitosa');
    });

    const req = http.expectOne(`${BASE}/15/asignar-manual`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      message: 'Asignación manual exitosa',
      result: { success: true, assigned: true, type: 'manual' },
      trip: { id: 15, status: 'aceptada' },
    });
  });

  it('should patch /:id/cancelar to cancel a trip', () => {
    api.cancelTrip(20, 'Cambio de planes').subscribe((trip) => {
      expect(trip.status).toBe('cancelada');
    });

    const req = http.expectOne(`${BASE}/20/cancelar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ reason: 'Cambio de planes' });
    req.flush({
      message: 'Carrera cancelada exitosamente',
      trip: { id: 20, status: 'cancelada' },
    });
  });
});


import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Passenger,
  PassengerPayload,
  PassengerRegisterPayload,
  PassengerRegisterResponse,
} from '../../core/models/passenger.model';

@Injectable({ providedIn: 'root' })
export class PassengerApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/pasajeros`;

  /** Registro público de pasajeros (sin autenticación previa) */
  register(payload: PassengerRegisterPayload): Observable<PassengerRegisterResponse> {
    return this.http.post<PassengerRegisterResponse>(`${this.base}/registro`, payload);
  }

  list(): Observable<Passenger[]> {
    return this.http.get<{ passengers: Passenger[] }>(this.base).pipe(map((r) => r.passengers));
  }

  get(id: number): Observable<Passenger> {
    return this.http.get<{ passenger: Passenger }>(`${this.base}/${id}`).pipe(map((r) => r.passenger));
  }

  create(payload: PassengerPayload): Observable<Passenger> {
    return this.http.post<{ passenger: Passenger }>(this.base, payload).pipe(map((r) => r.passenger));
  }

  update(id: number, payload: Partial<PassengerPayload>): Observable<Passenger> {
    return this.http.patch<{ passenger: Passenger }>(`${this.base}/${id}`, payload).pipe(map((r) => r.passenger));
  }

  replace(id: number, payload: PassengerPayload): Observable<Passenger> {
    return this.http.put<{ passenger: Passenger }>(`${this.base}/${id}`, payload).pipe(map((r) => r.passenger));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

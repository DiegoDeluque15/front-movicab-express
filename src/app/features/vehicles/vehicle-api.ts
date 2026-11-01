import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vehicle, VehiclePayload } from '../../core/models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehiculos`;

  list(): Observable<Vehicle[]> {
    return this.http.get<{ vehicles: Vehicle[] }>(this.base).pipe(map((r) => r.vehicles));
  }

  get(id: number): Observable<Vehicle> {
    return this.http.get<{ vehicle: Vehicle }>(`${this.base}/${id}`).pipe(map((r) => r.vehicle));
  }

  create(payload: VehiclePayload): Observable<Vehicle> {
    return this.http.post<{ vehicle: Vehicle }>(this.base, payload).pipe(map((r) => r.vehicle));
  }

  update(id: number, payload: Partial<VehiclePayload>): Observable<Vehicle> {
    return this.http.patch<{ vehicle: Vehicle }>(`${this.base}/${id}`, payload).pipe(map((r) => r.vehicle));
  }

  replace(id: number, payload: VehiclePayload): Observable<Vehicle> {
    return this.http.put<{ vehicle: Vehicle }>(`${this.base}/${id}`, payload).pipe(map((r) => r.vehicle));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

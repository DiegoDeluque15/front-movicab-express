import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VehicleType, VehicleTypePayload } from '../../core/models/vehicle-type.model';

@Injectable({ providedIn: 'root' })
export class VehicleTypeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipos-vehiculo`;

  list(): Observable<VehicleType[]> {
    return this.http.get<{ vehicle_types: VehicleType[] }>(this.base).pipe(map((r) => r.vehicle_types));
  }

  get(id: number): Observable<VehicleType> {
    return this.http.get<{ vehicle_type: VehicleType }>(`${this.base}/${id}`).pipe(map((r) => r.vehicle_type));
  }

  create(payload: VehicleTypePayload): Observable<VehicleType> {
    return this.http.post<{ vehicle_type: VehicleType }>(this.base, payload).pipe(map((r) => r.vehicle_type));
  }

  update(id: number, payload: Partial<VehicleTypePayload>): Observable<VehicleType> {
    return this.http.patch<{ vehicle_type: VehicleType }>(`${this.base}/${id}`, payload).pipe(map((r) => r.vehicle_type));
  }

  replace(id: number, payload: VehicleTypePayload): Observable<VehicleType> {
    return this.http.put<{ vehicle_type: VehicleType }>(`${this.base}/${id}`, payload).pipe(map((r) => r.vehicle_type));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

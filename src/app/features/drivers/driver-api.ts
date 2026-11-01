import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Driver, DriverPayload } from '../../core/models/driver.model';

@Injectable({ providedIn: 'root' })
export class DriverApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/conductores`;

  list(): Observable<Driver[]> {
    return this.http.get<{ drivers: Driver[] }>(this.base).pipe(map((r) => r.drivers));
  }

  get(id: number): Observable<Driver> {
    return this.http.get<{ driver: Driver }>(`${this.base}/${id}`).pipe(map((r) => r.driver));
  }

  create(payload: DriverPayload): Observable<Driver> {
    return this.http.post<{ driver: Driver }>(this.base, payload).pipe(map((r) => r.driver));
  }

  update(id: number, payload: Partial<DriverPayload>): Observable<Driver> {
    return this.http.patch<{ driver: Driver }>(`${this.base}/${id}`, payload).pipe(map((r) => r.driver));
  }

  replace(id: number, payload: DriverPayload): Observable<Driver> {
    return this.http.put<{ driver: Driver }>(`${this.base}/${id}`, payload).pipe(map((r) => r.driver));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

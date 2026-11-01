import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Shift, ShiftPayload } from '../../core/models/shift.model';

@Injectable({ providedIn: 'root' })
export class ShiftApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/turnos`;

  list(): Observable<Shift[]> {
    return this.http.get<{ shifts: Shift[] }>(this.base).pipe(map((r) => r.shifts));
  }

  get(id: number): Observable<Shift> {
    return this.http.get<{ shift: Shift }>(`${this.base}/${id}`).pipe(map((r) => r.shift));
  }

  create(payload: ShiftPayload): Observable<Shift> {
    return this.http.post<{ shift: Shift }>(this.base, payload).pipe(map((r) => r.shift));
  }

  update(id: number, payload: Partial<ShiftPayload>): Observable<Shift> {
    return this.http.patch<{ shift: Shift }>(`${this.base}/${id}`, payload).pipe(map((r) => r.shift));
  }

  replace(id: number, payload: ShiftPayload): Observable<Shift> {
    return this.http.put<{ shift: Shift }>(`${this.base}/${id}`, payload).pipe(map((r) => r.shift));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

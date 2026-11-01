import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Fare, FarePayload } from '../../core/models/fare.model';

@Injectable({ providedIn: 'root' })
export class FareApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tarifas`;

  list(): Observable<Fare[]> {
    return this.http.get<{ fares: Fare[] }>(this.base).pipe(map((r) => r.fares));
  }

  get(id: number): Observable<Fare> {
    return this.http.get<{ fare: Fare }>(`${this.base}/${id}`).pipe(map((r) => r.fare));
  }

  create(payload: FarePayload): Observable<Fare> {
    return this.http.post<{ fare: Fare }>(this.base, payload).pipe(map((r) => r.fare));
  }

  update(id: number, payload: Partial<FarePayload>): Observable<Fare> {
    return this.http.patch<{ fare: Fare }>(`${this.base}/${id}`, payload).pipe(map((r) => r.fare));
  }

  replace(id: number, payload: FarePayload): Observable<Fare> {
    return this.http.put<{ fare: Fare }>(`${this.base}/${id}`, payload).pipe(map((r) => r.fare));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }

  current(): Observable<Fare> {
    return this.http.get<{ fare: Fare }>(`${this.base}/vigente`).pipe(map((r) => r.fare));
  }
}

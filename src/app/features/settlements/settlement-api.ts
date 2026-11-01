import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Settlement, SettlementPayload } from '../../core/models/settlement.model';

@Injectable({ providedIn: 'root' })
export class SettlementApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/liquidaciones`;

  list(): Observable<Settlement[]> {
    return this.http.get<{ settlements: Settlement[] }>(this.base).pipe(map((r) => r.settlements));
  }

  get(id: number): Observable<Settlement> {
    return this.http.get<{ settlement: Settlement }>(`${this.base}/${id}`).pipe(map((r) => r.settlement));
  }

  create(payload: SettlementPayload): Observable<Settlement> {
    return this.http.post<{ settlement: Settlement }>(this.base, payload).pipe(map((r) => r.settlement));
  }
}

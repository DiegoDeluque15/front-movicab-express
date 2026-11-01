import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentPayload } from '../../core/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/pagos`;

  list(): Observable<Payment[]> {
    return this.http.get<{ payments: Payment[] }>(this.base).pipe(map((r) => r.payments));
  }

  get(id: number): Observable<Payment> {
    return this.http.get<{ payment: Payment }>(`${this.base}/${id}`).pipe(map((r) => r.payment));
  }

  create(payload: PaymentPayload): Observable<Payment> {
    return this.http.post<{ payment: Payment }>(this.base, payload).pipe(map((r) => r.payment));
  }
}

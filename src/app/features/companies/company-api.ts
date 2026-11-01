import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, CompanyPayload } from '../../core/models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/empresas`;

  list(): Observable<Company[]> {
    return this.http.get<{ companies: Company[] }>(this.base).pipe(map((r) => r.companies));
  }

  get(id: number): Observable<Company> {
    return this.http.get<{ company: Company }>(`${this.base}/${id}`).pipe(map((r) => r.company));
  }

  create(payload: CompanyPayload): Observable<Company> {
    return this.http.post<{ company: Company }>(this.base, payload).pipe(map((r) => r.company));
  }

  update(id: number, payload: Partial<CompanyPayload>): Observable<Company> {
    return this.http.patch<{ company: Company }>(`${this.base}/${id}`, payload).pipe(map((r) => r.company));
  }

  replace(id: number, payload: CompanyPayload): Observable<Company> {
    return this.http.put<{ company: Company }>(`${this.base}/${id}`, payload).pipe(map((r) => r.company));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

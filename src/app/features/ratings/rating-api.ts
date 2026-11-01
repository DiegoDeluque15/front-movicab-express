import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rating, RatingPayload } from '../../core/models/rating.model';

@Injectable({ providedIn: 'root' })
export class RatingApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/calificaciones`;

  list(): Observable<Rating[]> {
    return this.http.get<{ ratings: Rating[] }>(this.base).pipe(map((r) => r.ratings));
  }

  get(id: number): Observable<Rating> {
    return this.http.get<{ rating: Rating }>(`${this.base}/${id}`).pipe(map((r) => r.rating));
  }

  create(payload: RatingPayload): Observable<Rating> {
    return this.http.post<{ rating: Rating }>(this.base, payload).pipe(map((r) => r.rating));
  }

  update(id: number, payload: Partial<RatingPayload>): Observable<Rating> {
    return this.http.patch<{ rating: Rating }>(`${this.base}/${id}`, payload).pipe(map((r) => r.rating));
  }

  replace(id: number, payload: RatingPayload): Observable<Rating> {
    return this.http.put<{ rating: Rating }>(`${this.base}/${id}`, payload).pipe(map((r) => r.rating));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

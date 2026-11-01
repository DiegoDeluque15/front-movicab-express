import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface GeocodingResult {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.map.nominatimApiUrl;

  /**
   * Busca direcciones y lugares mediante OpenStreetMap Nominatim.
   * Filtra por defecto en Colombia ('co') para optimizar relevancia y latencia.
   */
  searchAddress(query: string): Observable<GeocodingResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return of([]);
    }

    const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=co&limit=5&addressdetails=1`;

    return this.http.get<any[]>(url).pipe(
      timeout(4000),
      map((items) =>
        items.map((item) => {
          const parts = item.display_name.split(',');
          const shortName = parts.slice(0, 2).join(',').trim();
          return {
            displayName: item.display_name,
            shortName: shortName || item.display_name,
            lat: Number(parseFloat(item.lat).toFixed(6)),
            lng: Number(parseFloat(item.lon).toFixed(6)),
          };
        })
      ),
      catchError((err) => {
        console.warn('Fallo en búsqueda de direcciones Nominatim:', err?.message);
        return of([]);
      })
    );
  }

  /**
   * Geocodificación inversa: obtiene la dirección a partir de coordenadas lat/lng.
   */
  reverseGeocode(lat: number, lng: number): Observable<string> {
    const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}`;

    return this.http.get<any>(url).pipe(
      timeout(4000),
      map((res) => {
        if (res && res.display_name) {
          const parts = res.display_name.split(',');
          // Retornar primera parte relevante (calle, barrio, ciudad)
          return parts.slice(0, 3).join(',').trim();
        }
        return `Ubicación (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }),
      catchError(() => of(`Ubicación (${lat.toFixed(4)}, ${lng.toFixed(4)})`))
    );
  }
}


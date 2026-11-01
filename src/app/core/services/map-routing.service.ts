import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RoadRouteResult {
  coordinates: [number, number][]; // [lat, lng] list for Leaflet polyline
  distanceKm: number;
  durationMin: number;
  isRealRoute: boolean;
  provider: string;
}

@Injectable({ providedIn: 'root' })
export class MapRoutingService {
  private readonly http = inject(HttpClient);
  private readonly osrmUrl = environment.map.osrmApiUrl;

  /**
   * Obtiene la ruta vial real trazada por las calles usando OSRM.
   * Retorna una secuencia detallada de coordenadas [lat, lng] para la polilínea.
   */
  getRoadRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Observable<RoadRouteResult> {
    const url = `${this.osrmUrl}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    return this.http.get<any>(url).pipe(
      timeout(5000),
      map((res) => {
        if (res && res.routes && res.routes.length > 0) {
          const route = res.routes[0];
          // OSRM devuelve coordenadas en formato [lng, lat], Leaflet requiere [lat, lng]
          const latLngs: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );

          return {
            coordinates: latLngs,
            distanceKm: Number((route.distance / 1000).toFixed(2)),
            durationMin: Number((route.duration / 60).toFixed(1)),
            isRealRoute: true,
            provider: 'OSRM OpenStreetMap',
          };
        }
        return this.getFallbackRoute(origin, destination);
      }),
      catchError((err) => {
        console.warn('OSRM no disponible, aplicando ruta geodésica de respaldo:', err?.message);
        return of(this.getFallbackRoute(origin, destination));
      })
    );
  }

  /**
   * Ruta de respaldo en línea recta geodésica si el servicio vial no responde
   */
  private getFallbackRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): RoadRouteResult {
    const distanceKm = this.calculateHaversine(origin, destination);
    return {
      coordinates: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      distanceKm,
      durationMin: Number(((distanceKm / 25) * 60).toFixed(1)), // Estimado 25 km/h
      isRealRoute: false,
      provider: 'Haversine (Línea directa)',
    };
  }

  private calculateHaversine(orig: { lat: number; lng: number }, dest: { lat: number; lng: number }): number {
    const R = 6371; // km
    const dLat = ((dest.lat - orig.lat) * Math.PI) / 180;
    const dLng = ((dest.lng - orig.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((orig.lat * Math.PI) / 180) *
      Math.cos((dest.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }
}


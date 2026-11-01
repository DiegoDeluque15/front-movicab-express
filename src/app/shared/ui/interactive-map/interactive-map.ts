import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { GeoCoordinates } from '../../../core/models/trip.model';
import { GeocodingResult, GeocodingService } from '../../../core/services/geocoding.service';
import { MapRoutingService, RoadRouteResult } from '../../../core/services/map-routing.service';

declare const L: any;

export interface DispatchMarkerResource {
  id: number;
  name: string;
  plate: string;
  lat: number;
  lng: number;
  isAvailable: boolean;
}

@Component({
  selector: 'app-interactive-map',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.css',
})
export class InteractiveMap implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private readonly geocodingService = inject(GeocodingService);
  private readonly routingService = inject(MapRoutingService);

  readonly origin = input<GeoCoordinates | null>(null);
  readonly destination = input<GeoCoordinates | null>(null);
  readonly driverLocation = input<{ lat: number; lng: number; heading?: number | null; speed?: number | null } | null>(null);
  readonly dispatchResources = input<DispatchMarkerResource[] | null>(null);
  readonly interactiveMode = input<'passenger_pickup' | 'driver_navigation' | 'passenger_tracking' | 'dispatch_overview'>('passenger_pickup');
  readonly height = input<string>('420px');
  readonly showSearch = input<boolean>(true);

  readonly originSelected = output<GeoCoordinates>();
  readonly destinationSelected = output<GeoCoordinates>();
  readonly resourceSelected = output<number>();

  // Estado del mapa y capas
  private map: any = null;
  private originMarker: any = null;
  private destinationMarker: any = null;
  private driverMarker: any = null;
  private routePolyline: any = null;
  private dispatchMarkerGroup: any = null;

  // Búsqueda y geocodificación
  searchQuery = signal('');
  searchTarget = signal<'origin' | 'destination'>('origin');
  searchResults = signal<GeocodingResult[]>([]);
  isSearching = signal(false);
  activeRouteInfo = signal<RoadRouteResult | null>(null);

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private resizeObserver?: ResizeObserver;

  // Próximo objetivo al hacer clic directo en el mapa
  clickTarget: 'origin' | 'destination' = 'origin';

  constructor() {
    // Reaccionar a cambios en señales de entrada
    effect(() => {
      const orig = this.origin();
      const dest = this.destination();
      const driver = this.driverLocation();
      const dispatch = this.dispatchResources();

      if (this.map) {
        this.map.invalidateSize();
        this.updateOriginMarker(orig);
        this.updateDestinationMarker(dest);
        this.updateDriverMarker(driver);
        this.updateDispatchMarkers(dispatch);
        this.refreshRoute(orig, dest);
      }
    });
  }

  ngOnInit(): void {
    this.initMap();
    this.setupSearchStream();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined' && this.mapContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }

  private initMap(): void {
    if (typeof L === 'undefined') {
      console.warn('Leaflet (L) no disponible en este entorno.');
      return;
    }

    const initialCenter = this.origin() || environment.map.defaultCenter;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: environment.map.defaultZoom,
      zoomControl: false, // Usaremos control de zoom reposicionado
    });

    // Control de zoom discreto en la esquina inferior derecha
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Teselas optimizadas de OpenStreetMap con múltiples subdominios y precarga de buffer
    L.tileLayer(environment.map.tileLayerUrl, {
      maxZoom: environment.map.maxZoom,
      attribution: environment.map.attribution,
      subdomains: ['a', 'b', 'c'],
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: true,
      crossOrigin: true,
    }).addTo(this.map);

    // Invalidaciones escalonadas para absorber la animación y el cálculo de layout de PrimeNG/CSS
    setTimeout(() => this.map?.invalidateSize(), 50);
    setTimeout(() => this.map?.invalidateSize(), 200);
    setTimeout(() => this.map?.invalidateSize(), 600);

    // Manejo de clics en el mapa en modo de selección
    if (this.interactiveMode() === 'passenger_pickup') {
      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.handleMapClick(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });
    }

    // Inicializar marcadores con datos ya presentes
    this.updateOriginMarker(this.origin());
    this.updateDestinationMarker(this.destination());
    this.updateDriverMarker(this.driverLocation());
    this.updateDispatchMarkers(this.dispatchResources());
    this.refreshRoute(this.origin(), this.destination());
  }

  private setupSearchStream(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || term.trim().length < 3) {
            this.isSearching.set(false);
            return [];
          }
          this.isSearching.set(true);
          return this.geocodingService.searchAddress(term);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.isSearching.set(false);
        },
        error: () => this.isSearching.set(false),
      });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  selectSearchResult(result: GeocodingResult): void {
    const coords: GeoCoordinates = {
      lat: result.lat,
      lng: result.lng,
      address: result.shortName || result.displayName,
    };

    if (this.searchTarget() === 'origin') {
      this.originSelected.emit(coords);
      this.searchTarget.set('destination');
    } else {
      this.destinationSelected.emit(coords);
      this.searchTarget.set('origin');
    }

    this.searchResults.set([]);
    this.searchQuery.set('');

    if (this.map) {
      this.map.setView([coords.lat, coords.lng], 15);
    }
  }

  setClickTarget(target: 'origin' | 'destination'): void {
    this.clickTarget = target;
    this.searchTarget.set(target);
  }

  /**
   * Captura y asigna la ubicación actual del usuario mediante Geolocation API
   */
  locateUser(): void {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada por el navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        this.geocodingService.reverseGeocode(lat, lng).subscribe((address) => {
          const coords: GeoCoordinates = { lat, lng, address };
          this.originSelected.emit(coords);

          if (this.map) {
            this.map.setView([lat, lng], 16);
          }
          this.clickTarget = 'destination';
          this.searchTarget.set('destination');
        });
      },
      (err) => console.warn('Error al obtener ubicación actual:', err?.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  private handleMapClick(lat: number, lng: number): void {
    this.geocodingService.reverseGeocode(lat, lng).subscribe((address) => {
      const coords: GeoCoordinates = { lat, lng, address };

      if (this.clickTarget === 'origin') {
        this.originSelected.emit(coords);
        this.clickTarget = 'destination';
        this.searchTarget.set('destination');
      } else {
        this.destinationSelected.emit(coords);
        this.clickTarget = 'origin';
        this.searchTarget.set('origin');
      }
    });
  }

  /**
   * Actualiza el marcador de Origen (Verde con icono de recogida y arrastrable)
   */
  private updateOriginMarker(orig: GeoCoordinates | null): void {
    if (!this.map || typeof L === 'undefined') return;

    if (!orig) {
      if (this.originMarker) {
        this.map.removeLayer(this.originMarker);
        this.originMarker = null;
      }
      return;
    }

    const isDraggable = this.interactiveMode() === 'passenger_pickup';

    const icon = L.divIcon({
      className: 'custom-pin-container',
      html: `
        <div class="pin-pulse-origin flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white border-2 border-white shadow-lg cursor-grab active:cursor-grabbing">
          <i class="pi pi-map-marker text-sm"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    if (this.originMarker) {
      this.originMarker.setLatLng([orig.lat, orig.lng]);
    } else {
      this.originMarker = L.marker([orig.lat, orig.lng], { icon, draggable: isDraggable }).addTo(this.map);

      if (isDraggable) {
        this.originMarker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          const cleanLat = Number(lat.toFixed(6));
          const cleanLng = Number(lng.toFixed(6));
          this.geocodingService.reverseGeocode(cleanLat, cleanLng).subscribe((address) => {
            this.originSelected.emit({ lat: cleanLat, lng: cleanLng, address });
          });
        });
      }
    }

    this.originMarker.bindPopup(`
      <div class="p-1">
        <span class="font-bold text-emerald-700 text-xs uppercase block">Punto de Recogida</span>
        <span class="text-xs text-slate-700">${orig.address || `${orig.lat}, ${orig.lng}`}</span>
      </div>
    `);
  }

  /**
   * Actualiza el marcador de Destino (Rojo con bandera y arrastrable)
   */
  private updateDestinationMarker(dest: GeoCoordinates | null): void {
    if (!this.map || typeof L === 'undefined') return;

    if (!dest) {
      if (this.destinationMarker) {
        this.map.removeLayer(this.destinationMarker);
        this.destinationMarker = null;
      }
      return;
    }

    const isDraggable = this.interactiveMode() === 'passenger_pickup';

    const icon = L.divIcon({
      className: 'custom-pin-container',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white border-2 border-white shadow-lg cursor-grab active:cursor-grabbing">
          <i class="pi pi-flag text-sm"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    if (this.destinationMarker) {
      this.destinationMarker.setLatLng([dest.lat, dest.lng]);
    } else {
      this.destinationMarker = L.marker([dest.lat, dest.lng], { icon, draggable: isDraggable }).addTo(this.map);

      if (isDraggable) {
        this.destinationMarker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          const cleanLat = Number(lat.toFixed(6));
          const cleanLng = Number(lng.toFixed(6));
          this.geocodingService.reverseGeocode(cleanLat, cleanLng).subscribe((address) => {
            this.destinationSelected.emit({ lat: cleanLat, lng: cleanLng, address });
          });
        });
      }
    }

    this.destinationMarker.bindPopup(`
      <div class="p-1">
        <span class="font-bold text-rose-700 text-xs uppercase block">Destino</span>
        <span class="text-xs text-slate-700">${dest.address || `${dest.lat}, ${dest.lng}`}</span>
      </div>
    `);
  }

  /**
   * Actualiza el marcador vehicular con transición de desplazamiento suave (sin saltos bruscos)
   */
  private updateDriverMarker(driver: { lat: number; lng: number; heading?: number | null; speed?: number | null } | null): void {
    if (!this.map || typeof L === 'undefined') return;

    if (!driver) {
      if (this.driverMarker) {
        this.map.removeLayer(this.driverMarker);
        this.driverMarker = null;
      }
      return;
    }

    const rotation = driver.heading || 0;

    const icon = L.divIcon({
      className: 'smooth-vehicle-marker',
      html: `
        <div style="transform: rotate(${rotation}deg);" class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white border-2 border-white shadow-xl">
          <i class="pi pi-car text-base"></i>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });

    if (this.driverMarker) {
      this.driverMarker.setLatLng([driver.lat, driver.lng]);
      this.driverMarker.setIcon(icon);
    } else {
      this.driverMarker = L.marker([driver.lat, driver.lng], { icon, zIndexOffset: 1000 }).addTo(this.map);
    }

    this.driverMarker.bindPopup(`
      <div class="p-1.5 space-y-1">
        <span class="font-bold text-blue-700 text-xs block">Unidad de Transporte MoviCab</span>
        <span class="text-[11px] text-slate-600 block">Velocidad: <b>${driver.speed ? `${driver.speed} km/h` : 'Estacionado'}</b></span>
        <span class="text-[10px] text-slate-400 font-mono">${driver.lat.toFixed(4)}, ${driver.lng.toFixed(4)}</span>
      </div>
    `);
  }

  /**
   * Renderiza los recursos de la central de despacho (conductores y vehículos disponibles / en turno)
   */
  private updateDispatchMarkers(resources: DispatchMarkerResource[] | null): void {
    if (!this.map || typeof L === 'undefined') return;

    if (this.dispatchMarkerGroup) {
      this.map.removeLayer(this.dispatchMarkerGroup);
      this.dispatchMarkerGroup = null;
    }

    if (!resources || resources.length === 0) return;

    const markers: any[] = [];

    for (const res of resources) {
      if (!res.lat || !res.lng) continue;

      const bgClass = res.isAvailable ? 'bg-emerald-600' : 'bg-slate-500';
      const label = res.isAvailable ? 'Disponible' : 'Ocupado';

      const icon = L.divIcon({
        className: 'dispatch-unit-marker',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full ${bgClass} text-white border-2 border-white shadow-md">
            <i class="pi pi-car text-xs"></i>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([res.lat, res.lng], { icon });
      marker.bindPopup(`
        <div class="p-1 space-y-1">
          <span class="font-bold text-slate-800 text-xs block">${res.name}</span>
          <span class="text-[11px] text-slate-500 block">Placa: <b>${res.plate}</b></span>
          <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${res.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${label}</span>
        </div>
      `);

      marker.on('click', () => {
        this.resourceSelected.emit(res.id);
      });

      markers.push(marker);
    }

    if (markers.length > 0) {
      this.dispatchMarkerGroup = L.featureGroup(markers).addTo(this.map);
    }
  }

  /**
   * Calcula y dibuja la polilínea vial real o geodésica entre origen y destino
   */
  private refreshRoute(orig: GeoCoordinates | null, dest: GeoCoordinates | null): void {
    if (!this.map || typeof L === 'undefined') return;

    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }

    if (!orig || !dest) {
      this.activeRouteInfo.set(null);
      return;
    }

    // Obtener ruta vial real con OSRM (con fallback geodésico automático)
    this.routingService.getRoadRoute(orig, dest).subscribe((routeResult) => {
      this.activeRouteInfo.set(routeResult);

      if (this.map && routeResult.coordinates.length > 0) {
        this.routePolyline = L.polyline(routeResult.coordinates, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
          dashArray: routeResult.isRealRoute ? undefined : '6, 8', // punteado si es fallback
        }).addTo(this.map);

        // Asegurar cálculo de dimensiones antes de auto-encuadrar
        this.map.invalidateSize();

        // Encuadrar la cámara automáticamente para mostrar toda la ruta con margen visual
        const bounds = L.latLngBounds(routeResult.coordinates);
        this.map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
        setTimeout(() => this.map?.invalidateSize(), 150);
      }
    });
  }
}

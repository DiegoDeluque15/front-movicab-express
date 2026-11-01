import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { InteractiveMap, DispatchMarkerResource } from '../../../shared/ui/interactive-map/interactive-map';
import { TripApi } from '../../trips/trip-api';
import { Trip } from '../../../core/models/trip.model';
import { AvailableShiftResource } from '../../../core/models/dispatch.model';

@Component({
  selector: 'app-dispatch-panel',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    CardModule,
    MessageModule,
    PageHeader,
    EmptyState,
    InteractiveMap,
  ],
  templateUrl: './dispatch-panel.html',
  styleUrl: './dispatch-panel.css',
})
export class DispatchPanel implements OnInit {
  private readonly tripApi = inject(TripApi);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  pendingTrips = signal<Trip[]>([]);
  availableShifts = signal<AvailableShiftResource[]>([]);
  loadingTrips = signal(true);
  loadingResources = signal(true);

  // Carrera seleccionada para inspección en el mapa
  selectedTripForMap = signal<Trip | null>(null);

  // Marcadores de recursos operativos para el mapa cartográfico
  readonly dispatchMarkers = computed<DispatchMarkerResource[]>(() => {
    return this.availableShifts()
      .filter((s) => s.driver.current_lat !== null && s.driver.current_lng !== null && !isNaN(Number(s.driver.current_lat)))
      .map((s) => ({
        id: s.driver.id,
        name: s.driver.name,
        plate: s.vehicle.plate,
        lat: Number(s.driver.current_lat),
        lng: Number(s.driver.current_lng),
        isAvailable: true,
      }));
  });

  // Asignación manual modal
  showAssignModal = signal(false);
  selectedTrip = signal<Trip | null>(null);
  selectedShiftResource = signal<AvailableShiftResource | null>(null);
  assignNotes = signal('');
  isAssigning = signal(false);
  assignError = signal<string | null>(null);

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadPendingTrips();
    this.loadAvailableResources();
  }

  loadPendingTrips(): void {
    this.loadingTrips.set(true);
    this.tripApi.getPendingTrips().subscribe({
      next: (trips) => {
        this.pendingTrips.set(trips || []);
        this.loadingTrips.set(false);
        if (trips && trips.length > 0 && !this.selectedTripForMap()) {
          this.selectedTripForMap.set(trips[0]);
        }
      },
      error: () => {
        this.loadingTrips.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron consultar las carreras pendientes de despacho.',
        });
      },
    });
  }

  loadAvailableResources(): void {
    this.loadingResources.set(true);
    this.tripApi.getAvailableResources().subscribe({
      next: (data) => {
        this.availableShifts.set(data.available_shifts || []);
        this.loadingResources.set(false);
      },
      error: () => {
        this.loadingResources.set(false);
      },
    });
  }

  selectTripForMap(trip: Trip): void {
    this.selectedTripForMap.set(trip);
  }

  openAssignModal(trip: Trip): void {
    this.selectedTrip.set(trip);
    this.selectedTripForMap.set(trip);
    this.selectedShiftResource.set(null);
    this.assignNotes.set('');
    this.assignError.set(null);
    this.showAssignModal.set(true);
  }

  onMarkerResourceSelected(driverId: number): void {
    const shift = this.availableShifts().find((s) => s.driver.id === driverId);
    if (shift) {
      this.selectedShiftResource.set(shift);
      this.messages.add({
        severity: 'info',
        summary: 'Unidad Seleccionada',
        detail: `Conductor ${shift.driver.name} (${shift.vehicle.plate}) listo para asignación.`,
      });
    }
  }

  confirmManualAssignment(): void {
    const trip = this.selectedTrip();
    const resource = this.selectedShiftResource();

    if (!trip || !resource) {
      this.assignError.set('Debes seleccionar un conductor y vehículo disponible.');
      return;
    }

    this.isAssigning.set(true);
    this.assignError.set(null);

    this.tripApi
      .assignManual(trip.id, {
        driver_id: resource.driver.id,
        vehicle_id: resource.vehicle.id,
        notes: this.assignNotes().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.isAssigning.set(false);
          this.showAssignModal.set(false);
          this.messages.add({
            severity: 'success',
            summary: 'Asignación Exitosa',
            detail: `Carrera #${trip.id} asignada a ${resource.driver.name} (${resource.vehicle.plate}).`,
          });
          this.refreshAll();
        },
        error: (err) => {
          this.isAssigning.set(false);
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            'Error al asignar conductor. El recurso puede haberse ocupado.';
          this.assignError.set(msg);
          this.loadAvailableResources();
        },
      });
  }

  trackTrip(tripId: number): void {
    this.router.navigate(['/trips', tripId, 'live']);
  }
}

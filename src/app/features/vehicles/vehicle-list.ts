import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { VehicleApi } from './vehicle-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
    selector: 'app-vehicle-list',
    imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule],
    templateUrl: './vehicle-list.html',
})
export class VehicleList implements OnInit {
    private readonly api = inject(VehicleApi);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    vehicles = signal<Vehicle[]>([]);
    loading = signal(true);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (data: Vehicle[]) => {
                this.vehicles.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar la lista de vehículos');
                this.loading.set(false);
            },
        });
    }

    confirmDelete(vehicle: Vehicle): void {
        this.confirm.confirm({
            message: `¿Eliminar el vehículo "${vehicle.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => this.delete(vehicle.id),
        });
    }

    private delete(id: number): void {
        this.api.remove(id).subscribe({
            next: () => {
                this.notify.success('Vehículo eliminado correctamente');
                this.load();
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar el vehículo porque tiene registros asociados.';
                this.notify.error(detail);
            },
        });
    }
}

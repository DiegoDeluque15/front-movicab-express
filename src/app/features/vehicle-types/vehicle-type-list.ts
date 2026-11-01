import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { VehicleTypeApi } from './vehicle-type-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { VehicleType } from '../../core/models/vehicle-type.model';

@Component({
    selector: 'app-vehicle-type-list',
    imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule],
    templateUrl: './vehicle-type-list.html',
})
export class VehicleTypeList implements OnInit {
    private readonly api = inject(VehicleTypeApi);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    vehicleTypes = signal<VehicleType[]>([]);
    loading = signal(true);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (data: VehicleType[]) => {
                this.vehicleTypes.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar tipos de vehículo');
                this.loading.set(false);
            },
        });
    }

    confirmDelete(type: VehicleType): void {
        this.confirm.confirm({
            message: `¿Eliminar el tipo de vehículo "${type.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => this.delete(type.id),
        });
    }

    private delete(id: number): void {
        this.api.remove(id).subscribe({
            next: () => {
                this.notify.success('Tipo de vehículo eliminado correctamente');
                this.load();
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar: el tipo tiene vehículos asociados.';
                this.notify.error(detail);
            },
        });
    }
}
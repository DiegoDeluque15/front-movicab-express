import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { DriverApi } from './driver-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Driver } from '../../core/models/driver.model';

@Component({
    selector: 'app-driver-list',
    imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule],
    templateUrl: './driver-list.html',
})
export class DriverList implements OnInit {
    private readonly api = inject(DriverApi);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    drivers = signal<Driver[]>([]);
    loading = signal(true);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (data: Driver[]) => {
                this.drivers.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar la lista de conductores');
                this.loading.set(false);
            },
        });
    }

    confirmDelete(driver: Driver): void {
        this.confirm.confirm({
            message: `¿Eliminar al conductor "${driver.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => this.delete(driver.id),
        });
    }

    private delete(id: number): void {
        this.api.remove(id).subscribe({
            next: () => {
                this.notify.success('Conductor eliminado correctamente');
                this.load();
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar: el conductor tiene registros asociados.';
                this.notify.error(detail);
            },
        });
    }
}


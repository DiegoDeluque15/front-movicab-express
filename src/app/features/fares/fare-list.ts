import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { FareApi } from './fare-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Fare } from '../../core/models/fare.model';

@Component({
    selector: 'app-fare-list',
    imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule, DecimalPipe, DatePipe],
    templateUrl: './fare-list.html',
})
export class FareList implements OnInit {
    private readonly api = inject(FareApi);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    fares = signal<Fare[]>([]);
    loading = signal(true);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (data: Fare[]) => {
                this.fares.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar la lista de tarifas');
                this.loading.set(false);
            },
        });
    }

    confirmDelete(fare: Fare): void {
        this.confirm.confirm({
            message: `¿Eliminar la tarifa "${fare.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => this.delete(fare.id),
        });
    }

    private delete(id: number): void {
        this.api.remove(id).subscribe({
            next: () => {
                this.notify.success('Tarifa eliminada correctamente');
                this.load();
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar la tarifa.';
                this.notify.error(detail);
            },
        });
    }
}
